import { Router, Request, Response } from 'express';
import { initiateDeposit, verifyTONTransaction, verifyUSDTTransaction, initiateWithdrawal } from '../services/walletService';
import { db } from '../services/firebaseService';

const router = Router();

/**
 * GET /api/wallet/balance
 * Get WRB + CP balance
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      warBonds: req.player.stats.warBonds,
      commandPoints: req.player.stats.commandPoints
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallet/deposit/init
 * Start deposit flow
 */
router.post('/deposit/init', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currency } = req.body; // 'TON' or 'USDT_TRC20'
    if (!currency || !['TON', 'USDT_TRC20'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency. Must be TON or USDT_TRC20' });
    }

    const result = await initiateDeposit(req.player.telegramId, currency);
    res.json(result);
  } catch (error: any) {
    console.error('Error initiating deposit:', error);
    res.status(400).json({ error: error.message || 'Failed to initiate deposit' });
  }
});

/**
 * POST /api/wallet/deposit/verify
 * Verify TX hash
 */
router.post('/deposit/verify', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { txHash, currency, expectedAmount } = req.body;
    if (!txHash || !currency || !expectedAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let result;
    if (currency === 'TON') {
      result = await verifyTONTransaction(txHash, req.player.telegramId, expectedAmount);
    } else if (currency === 'USDT_TRC20') {
      result = await verifyUSDTTransaction(txHash, req.player.telegramId, expectedAmount);
    } else {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error verifying deposit:', error);
    res.status(400).json({ error: error.message || 'Failed to verify deposit' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Initiate withdrawal
 */
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { wrbAmount, toAddress, currency } = req.body;
    if (!wrbAmount || !toAddress || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await initiateWithdrawal(
      req.player.telegramId,
      wrbAmount,
      toAddress,
      currency as 'TON' | 'USDT_TRC20'
    );
    res.json(result);
  } catch (error: any) {
    console.error('Error initiating withdrawal:', error);
    res.status(400).json({ error: error.message || 'Failed to initiate withdrawal' });
  }
});

/**
 * GET /api/wallet/transactions
 * Transaction history
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('transactions')
      .where('playerId', '==', req.player.telegramId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const transactions = snapshot.docs.map(doc => doc.data());
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
