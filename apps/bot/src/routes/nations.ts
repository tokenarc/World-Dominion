import { Router, Request, Response } from 'express';
import { getAllNationsRTDB, getNation, db, seedNations } from '../services/firebaseService';

const router = Router();

/**
 * GET /api/nations
 * Get all nations with stats (RTDB)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const nations = await getAllNationsRTDB();
    res.json({ nations });
  } catch (error) {
    console.error('Error fetching nations from RTDB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/nations/:id
 * Get single nation
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const nation = await getNation(req.params.id as string);
    if (!nation) {
      return res.status(404).json({ error: 'Nation not found' });
    }
    res.json({ nation });
  } catch (error) {
    console.error('Error fetching nation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/nations/:id/players
 * Get players in nation
 */
router.get('/:id/players', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('players')
      .where('nationId', '==', req.params.id)
      .get();
    const players = snapshot.docs.map(doc => doc.data());
    res.json({ players });
  } catch (error) {
    console.error('Error fetching players in nation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/nations/:id/events
 * Get events affecting nation
 */
router.get('/:id/events', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('events')
      .where('affectedNations', 'array-contains', req.params.id)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    const events = snapshot.docs.map(doc => doc.data());
    res.json({ events });
  } catch (error) {
    console.error('Error fetching nation events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/nations/seed
 * Trigger database seeding
 */
router.post('/seed', async (req: Request, res: Response) => {
  try {
    await seedNations();
    res.json({ success: true, message: 'Nations seeded!' });
  } catch (error) {
    console.error('Seed failed:', error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

export default router;
