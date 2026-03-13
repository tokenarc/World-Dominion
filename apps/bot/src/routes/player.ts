import { Router, Request, Response } from 'express';
import { getPlayer, getLeaderboard, db } from '../services/firebaseService';

const router = Router();

/**
 * GET /api/player/me
 * Get full player data
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const player = await getPlayer(req.player.telegramId);
    res.json({ player });
  } catch (error) {
    console.error('Error fetching player data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/player/leaderboard
 * Get top players
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/player/missions
 * Get daily missions
 */
router.get('/missions', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Placeholder for missions logic
    // In a full implementation, this would fetch from a missions collection or config
    const snapshot = await db.collection('missions').get();
    const missions = snapshot.docs.map(doc => doc.data());
    res.json({ missions });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/player/claim-mission
 * Claim completed mission reward
 */
router.post('/claim-mission', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { missionId } = req.body;
    if (!missionId) {
      return res.status(400).json({ error: 'Missing missionId' });
    }

    // Placeholder for mission claiming logic
    res.json({ success: true, reward: { warBonds: 100, commandPoints: 50 } });
  } catch (error) {
    console.error('Error claiming mission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
