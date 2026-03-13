import { db, admin } from '../lib/firebase-admin';
import axios from 'axios';
import { Player, saveTransaction } from './firebaseService';
import * as fs from 'fs';
import * as path from 'path';

// Load liquidity system configuration
const liquiditySystem = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/liquidity_system.json'), 'utf8'));

export interface CryptoTransaction {
  id: string;
  playerId: string;
  txHash: string;
  amount: number;
  currency: 'TON' | 'USDT_TRC20';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

/**
 * Initiate a crypto deposit
 */
export const initiateDeposit = async (playerId: string, crypto: 'TON' | 'USDT_TRC20') => {
  const playerRef = db.collection('players').doc(playerId);
  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) throw new Error('Player not found');

  // Generate deposit instructions (placeholder for actual wallet generation)
  const walletAddress = crypto === 'TON' ? 'EQD_GAME_TON_WALLET_ADDRESS' : 'T_GAME_USDT_TRC20_WALLET_ADDRESS';
  
  const depositRef = db.collection('cryptoTransactions').doc();
  const depositData = {
    id: depositRef.id,
    playerId,
    currency: crypto,
    status: 'pending',
    walletAddress,
    timestamp: Date.now()
  };

  await depositRef.set(depositData);

  return {
    walletAddress,
    instructions: `Send ${crypto} to the address above and submit the transaction hash in the bot.`,
    transactionId: depositRef.id
  };
};

/**
 * Verify TON transaction via TonCenter API
 */
export const verifyTONTransaction = async (txHash: string, playerId: string, expectedAmount: number) => {
  try {
    const tonConfig = liquiditySystem.liquidity_system.blockchain_verification.TON;
    const url = tonConfig.verification_endpoint.replace('{wallet}', 'EQD_GAME_TON_WALLET_ADDRESS');
    
    const response = await axios.get(url);
    const transactions = response.data.result;

    // Find the transaction with the matching hash
    const tx = transactions.find((t: any) => t.transaction_id.hash === txHash);

    if (!tx) throw new Error('Transaction not found on blockchain');

    // Basic verification: to=TON_WALLET, amount=correct, confirmed>=3
    // In a real implementation, we'd check the 'in_msg' for destination and value
    const amountInNanoTon = tx.in_msg.value;
    const amountInTon = amountInNanoTon / 1e9;

    if (amountInTon < expectedAmount) throw new Error('Incorrect amount');

    // Credit WRB to player (1000 WRB = $10 USD, assuming 1 TON = $X USD)
    // For simplicity, let's assume 1 TON = 500 WRB (adjust based on actual rates)
    const wrbToCredit = Math.floor(amountInTon * 500);

    const playerRef = db.collection('players').doc(playerId);
    await playerRef.update({
      'stats.warBonds': admin.firestore.FieldValue.increment(wrbToCredit)
    });

    // Update transaction status
    await db.collection('cryptoTransactions').where('txHash', '==', txHash).get().then(snapshot => {
      snapshot.forEach(doc => doc.ref.update({ status: 'confirmed', amount: amountInTon }));
    });

    await saveTransaction({
      playerId,
      type: 'DEPOSIT',
      currency: 'TON',
      amount: amountInTon,
      wrbCredited: wrbToCredit,
      txHash,
      timestamp: Date.now()
    });

    return { success: true, wrbCredited: wrbToCredit };
  } catch (error) {
    console.error('TON Verification Error:', error);
    throw error;
  }
};

/**
 * Verify USDT (TRC-20) transaction via TronScan API
 */
export const verifyUSDTTransaction = async (txHash: string, playerId: string, expectedAmount: number) => {
  try {
    const usdtConfig = liquiditySystem.liquidity_system.blockchain_verification.USDT_TRC20;
    const url = usdtConfig.verification_endpoint.replace('{txhash}', txHash);
    
    const response = await axios.get(url);
    const tx = response.data;

    if (!tx || tx.contractRet !== 'SUCCESS') throw new Error('Transaction failed or not found');

    // Verify USDT TRC-20 transfer
    // In a real implementation, we'd parse the 'trc20TransferInfo'
    const transferInfo = tx.trc20TransferInfo?.find((info: any) => info.symbol === 'USDT');
    if (!transferInfo) throw new Error('Not a USDT transfer');

    const amountInUsdt = transferInfo.amount_str / 1e6;
    if (amountInUsdt < expectedAmount) throw new Error('Incorrect amount');

    // Credit WRB to player (1000 WRB = $10 USD)
    const wrbToCredit = Math.floor(amountInUsdt * 100);

    const playerRef = db.collection('players').doc(playerId);
    await playerRef.update({
      'stats.warBonds': admin.firestore.FieldValue.increment(wrbToCredit)
    });

    // Update transaction status
    await db.collection('cryptoTransactions').doc(txHash).set({
      playerId,
      txHash,
      currency: 'USDT_TRC20',
      amount: amountInUsdt,
      status: 'confirmed',
      timestamp: Date.now()
    }, { merge: true });

    await saveTransaction({
      playerId,
      type: 'DEPOSIT',
      currency: 'USDT_TRC20',
      amount: amountInUsdt,
      wrbCredited: wrbToCredit,
      txHash,
      timestamp: Date.now()
    });

    return { success: true, wrbCredited: wrbToCredit };
  } catch (error) {
    console.error('USDT Verification Error:', error);
    throw error;
  }
};

/**
 * Initiate a withdrawal
 */
export const initiateWithdrawal = async (playerId: string, wrbAmount: number, toAddress: string, crypto: 'TON' | 'USDT_TRC20') => {
  const playerRef = db.collection('players').doc(playerId);
  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) throw new Error('Player not found');
  const player = playerDoc.data() as Player;

  // 1. Check 48hr holding period
  const joinedAt = player.joinedAt || 0;
  if (Date.now() - joinedAt < 48 * 60 * 60 * 1000) {
    throw new Error('New accounts must wait 48 hours before withdrawing');
  }

  // 2. Check daily/monthly limits (from config)
  const rules = liquiditySystem.liquidity_system.withdrawal_rules;
  if (wrbAmount < rules.minimum_wrb) throw new Error(`Minimum withdrawal is ${rules.minimum_wrb} WRB`);
  if (wrbAmount > rules.maximum_per_day_wrb) throw new Error(`Maximum daily withdrawal is ${rules.maximum_per_day_wrb} WRB`);

  // 3. Check KYC if > $50 (assuming 1000 WRB = $10 USD, so 5000 WRB = $50)
  if (wrbAmount > 5000 && !player.kycVerified) {
    throw new Error('KYC verification required for withdrawals over 5000 WRB ($50)');
  }

  // 4. Deduct WRB from player balance
  if (player.stats.warBonds < wrbAmount) throw new Error('Insufficient War Bonds');

  await playerRef.update({
    'stats.warBonds': admin.firestore.FieldValue.increment(-wrbAmount)
  });

  // 5. Create withdrawal record
  const withdrawalRef = db.collection('withdrawals').doc();
  const withdrawalData = {
    id: withdrawalRef.id,
    playerId,
    wrbAmount,
    toAddress,
    currency: crypto,
    status: wrbAmount < 2000 ? 'processing' : 'pending_manual_review', // Auto-process if < $20 (2000 WRB)
    timestamp: Date.now()
  };

  await withdrawalRef.set(withdrawalData);

  return { success: true, withdrawalId: withdrawalRef.id, status: withdrawalData.status };
};
