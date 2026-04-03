import { db, admin } from '../lib/firebase-admin';

import { Player, saveTransaction } from './firebaseService';
import * as fs from 'fs';
import * as path from 'path';

const liquiditySystem = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../../data/liquidity_system.json'), 'utf8')
);

// ── Guard wallet addresses ───────────────────────────────────
const TON_WALLET_ADDRESS  = process.env.TON_WALLET_ADDRESS;
const USDT_WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS;

if (!TON_WALLET_ADDRESS)  console.warn('⚠️  TON_WALLET_ADDRESS not set');
if (!USDT_WALLET_ADDRESS) console.warn('⚠️  USDT_WALLET_ADDRESS not set');

export interface CryptoTransaction {
  id: string;
  playerId: string;
  txHash: string;
  amount: number;
  currency: 'TON' | 'USDT_TRC20';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

// ── Initiate deposit ─────────────────────────────────────────
export const initiateDeposit = async (playerId: string, crypto: 'TON' | 'USDT_TRC20') => {
  const playerDoc = await db.collection('players').doc(playerId).get();
  if (!playerDoc.exists) throw new Error('Player not found');

  const walletAddress = crypto === 'TON' ? TON_WALLET_ADDRESS : USDT_WALLET_ADDRESS;
  if (!walletAddress) throw new Error(`${crypto} wallet address not configured`);

  const depositRef  = db.collection('cryptoTransactions').doc();
  const depositData = {
    id:            depositRef.id,
    playerId,
    currency:      crypto,
    status:        'pending',
    walletAddress,
    timestamp:     Date.now(),
  };

  await depositRef.set(depositData);

  return {
    walletAddress,
    instructions: `Send ${crypto} to the address above. Submit the transaction hash after sending.`,
    transactionId: depositRef.id,
  };
};

// ── Check txHash not already processed (replay protection) ───
const assertTxHashUnused = async (txHash: string): Promise<void> => {
  const existing = await db.collection('cryptoTransactions')
    .where('txHash', '==', txHash)
    .where('status', '==', 'confirmed')
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new Error('Transaction already processed — duplicate txHash rejected');
  }
};

// ── Verify TON transaction ───────────────────────────────────
export const verifyTONTransaction = async (
  txHash: string,
  playerId: string,
  expectedAmount: number
) => {
  // Replay protection — must be first
  await assertTxHashUnused(txHash);

  const tonConfig = liquiditySystem.liquidity_system.blockchain_verification.TON;
  const url = tonConfig.verification_endpoint.replace('{wallet}', TON_WALLET_ADDRESS);

  const response    = await fetch(url);
  const transactions = await response.json().result;

  const tx = transactions.find((t: any) => t.transaction_id.hash === txHash);
  if (!tx) throw new Error('Transaction not found on blockchain');

  const amountInTon = tx.in_msg.value / 1e9;
  if (amountInTon < expectedAmount) throw new Error('Incorrect amount sent');

  const wrbToCredit = Math.floor(amountInTon * 500);

  // Atomic: credit player + mark tx confirmed in single batch
  const batch      = db.batch();
  const playerRef  = db.collection('players').doc(playerId);
  const txRef      = db.collection('cryptoTransactions').doc();

  batch.update(playerRef, {
    'stats.warBonds': admin.firestore.FieldValue.increment(wrbToCredit),
    'wallet.warBonds': admin.firestore.FieldValue.increment(wrbToCredit),
  });
  batch.set(txRef, {
    playerId,
    txHash,
    currency:  'TON',
    amount:    amountInTon,
    wrbCredited: wrbToCredit,
    status:    'confirmed',
    timestamp: Date.now(),
  });

  await batch.commit();

  await saveTransaction({
    playerId,
    type:       'DEPOSIT',
    currency:   'TON',
    amount:     amountInTon,
    wrbCredited: wrbToCredit,
    txHash,
    timestamp:  Date.now(),
  });

  return { success: true, wrbCredited: wrbToCredit };
};

// ── Verify USDT TRC-20 transaction ───────────────────────────
export const verifyUSDTTransaction = async (
  txHash: string,
  playerId: string,
  expectedAmount: number
) => {
  // Replay protection — must be first
  await assertTxHashUnused(txHash);

  const usdtConfig = liquiditySystem.liquidity_system.blockchain_verification.USDT_TRC20;
  const url = usdtConfig.verification_endpoint.replace('{txhash}', txHash);

  const response = await fetch(url);
  const tx       = await response.json();

  if (!tx || tx.contractRet !== 'SUCCESS') {
    throw new Error('Transaction failed or not found on blockchain');
  }

  const transferInfo = tx.trc20TransferInfo?.find((info: any) => info.symbol === 'USDT');
  if (!transferInfo) throw new Error('Not a USDT transfer');

  const amountInUsdt = transferInfo.amount_str / 1e6;
  if (amountInUsdt < expectedAmount) throw new Error('Incorrect amount sent');

  const wrbToCredit = Math.floor(amountInUsdt * 100);

  // Atomic: credit player + mark tx confirmed
  const batch     = db.batch();
  const playerRef = db.collection('players').doc(playerId);
  const txRef     = db.collection('cryptoTransactions').doc(txHash);

  batch.update(playerRef, {
    'stats.warBonds':  admin.firestore.FieldValue.increment(wrbToCredit),
    'wallet.warBonds': admin.firestore.FieldValue.increment(wrbToCredit),
  });
  batch.set(txRef, {
    playerId,
    txHash,
    currency:   'USDT_TRC20',
    amount:     amountInUsdt,
    wrbCredited: wrbToCredit,
    status:     'confirmed',
    timestamp:  Date.now(),
  });

  await batch.commit();

  await saveTransaction({
    playerId,
    type:       'DEPOSIT',
    currency:   'USDT_TRC20',
    amount:     amountInUsdt,
    wrbCredited: wrbToCredit,
    txHash,
    timestamp:  Date.now(),
  });

  return { success: true, wrbCredited: wrbToCredit };
};

// ── Initiate withdrawal — atomic with Firestore transaction ──
export const initiateWithdrawal = async (
  playerId: string,
  wrbAmount: number,
  toAddress: string,
  crypto: 'TON' | 'USDT_TRC20'
) => {
  if (!wrbAmount || wrbAmount <= 0) throw new Error('Invalid withdrawal amount');
  if (!toAddress || toAddress.length < 10) throw new Error('Invalid wallet address');

  const rules      = liquiditySystem.liquidity_system.withdrawal_rules;
  const playerRef  = db.collection('players').doc(playerId);
  const withdrawalRef = db.collection('withdrawals').doc();

  // Validate limits before touching DB
  if (wrbAmount < rules.minimum_wrb) {
    throw new Error(`Minimum withdrawal is ${rules.minimum_wrb} WRB`);
  }
  if (wrbAmount > rules.maximum_per_day_wrb) {
    throw new Error(`Maximum daily withdrawal is ${rules.maximum_per_day_wrb} WRB`);
  }

  // Atomic: check balance + deduct + create withdrawal record
  await db.runTransaction(async (transaction) => {
    const playerDoc = await transaction.get(playerRef);
    if (!playerDoc.exists) throw new Error('Player not found');

    const player = playerDoc.data() as Player;

    // 48hr new account hold
    if (Date.now() - (player.joinedAt || 0) < 48 * 60 * 60 * 1000) {
      throw new Error('New accounts must wait 48 hours before withdrawing');
    }

    // KYC check for large amounts
    if (wrbAmount > 5000 && !player.kycVerified) {
      throw new Error('KYC verification required for withdrawals over 5000 WRB');
    }

    // Balance check inside transaction — prevents race condition
    const currentBalance = player.stats?.warBonds || 0;
    if (currentBalance < wrbAmount) {
      throw new Error(`Insufficient War Bonds. Balance: ${currentBalance}`);
    }

    // Deduct balance
    transaction.update(playerRef, {
      'stats.warBonds':  admin.firestore.FieldValue.increment(-wrbAmount),
      'wallet.warBonds': admin.firestore.FieldValue.increment(-wrbAmount),
    });

    // Create withdrawal record
    transaction.set(withdrawalRef, {
      id:        withdrawalRef.id,
      playerId,
      wrbAmount,
      toAddress,
      currency:  crypto,
      status:    wrbAmount < 2000 ? 'processing' : 'pending_manual_review',
      timestamp: Date.now(),
    });
  });

  return {
    success:      true,
    withdrawalId: withdrawalRef.id,
    status:       wrbAmount < 2000 ? 'processing' : 'pending_manual_review',
  };
};
