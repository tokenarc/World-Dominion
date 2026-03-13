import { Router, Request, Response } from 'express';
import { buyItem, listP2PItem, buyP2PItem } from '../services/marketService';
import { db } from '../services/firebaseService';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

/**
 * GET /api/market/items
 * Get all available items from official marketplaces
 */
router.get('/items', async (req: Request, res: Response) => {
  try {
    const marketplaceConfigPath = path.join(__dirname, '../../../../data/economics/marketplaces_config.json');
    if (!fs.existsSync(marketplaceConfigPath)) {
      return res.status(500).json({ error: 'Marketplace configuration not found' });
    }

    const marketplaceConfig = JSON.parse(fs.readFileSync(marketplaceConfigPath, 'utf8'));
    res.json(marketplaceConfig);
  } catch (error) {
    console.error('Error fetching market items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/market/buy
 * Purchase item from official marketplace
 */
router.post('/buy', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { itemId, currency } = req.body;
    if (!itemId || !currency) {
      return res.status(400).json({ error: 'Missing itemId or currency' });
    }

    const result = await buyItem(req.player.telegramId, itemId, currency);
    res.json(result);
  } catch (error: any) {
    console.error('Error purchasing item:', error);
    res.status(400).json({ error: error.message || 'Failed to purchase item' });
  }
});

/**
 * GET /api/market/p2p
 * Get P2P listings
 */
router.get('/p2p', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('marketListings')
      .where('active', '==', true)
      .where('expiresAt', '>', Date.now())
      .orderBy('expiresAt', 'asc')
      .get();
    
    const listings = snapshot.docs.map(doc => doc.data());
    res.json({ listings });
  } catch (error) {
    console.error('Error fetching P2P listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/market/p2p/list
 * Create P2P listing
 */
router.post('/p2p/list', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { itemId, price, currency } = req.body;
    if (!itemId || !price || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const listing = await listP2PItem(req.player.telegramId, itemId, price, currency);
    res.json({ success: true, listing });
  } catch (error: any) {
    console.error('Error creating P2P listing:', error);
    res.status(400).json({ error: error.message || 'Failed to create listing' });
  }
});

/**
 * POST /api/market/p2p/buy/:listingId
 * Buy P2P listing
 */
router.post('/p2p/buy/:listingId', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await buyP2PItem(req.player.telegramId, req.params.listingId);
    res.json(result);
  } catch (error: any) {
    console.error('Error buying P2P item:', error);
    res.status(400).json({ error: error.message || 'Failed to buy P2P item' });
  }
});

/**
 * GET /api/market/stocks
 * Get all stock prices
 */
router.get('/stocks', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('stocks').get();
    const stocks = snapshot.docs.map(doc => doc.data());
    res.json({ stocks });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/market/stocks/trade
 * Buy/sell stock
 */
router.post('/stocks/trade', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { symbol, action, amount } = req.body;
    if (!symbol || !action || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Placeholder for stock trading logic
    // In a full implementation, this would update player balance and stock holdings
    res.json({ success: true, message: `Successfully ${action}ed ${amount} of ${symbol}` });
  } catch (error) {
    console.error('Error trading stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
