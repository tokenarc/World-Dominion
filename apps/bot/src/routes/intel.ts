import { Router, Request, Response } from 'express';
import { launchMission } from '../services/spyService';
import { db } from '../services/firebaseService';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

/**
 * GET /api/intel/missions
 * Get available missions
 */
router.get('/missions', async (req: Request, res: Response) => {
  try {
    const intelConfigPath = path.join(__dirname, '../../../../data/intelligence/intelligence_agencies.json');
    if (!fs.existsSync(intelConfigPath)) {
      return res.status(500).json({ error: 'Intelligence configuration not found' });
    }

    const intelConfig = JSON.parse(fs.readFileSync(intelConfigPath, 'utf8'));
    res.json(intelConfig.spy_mission_tree);
  } catch (error) {
    console.error('Error fetching intel missions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/intel/launch
 * Launch spy mission
 */
router.post('/launch', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetNationId, missionType } = req.body;
    if (!targetNationId || !missionType) {
      return res.status(400).json({ error: 'Missing targetNationId or missionType' });
    }

    const mission = await launchMission(req.player.telegramId, targetNationId, missionType);
    res.json({ success: true, mission });
  } catch (error: any) {
    console.error('Error launching mission:', error);
    res.status(400).json({ error: error.message || 'Failed to launch mission' });
  }
});

/**
 * GET /api/intel/active
 * Get active missions with countdowns
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('spyMissions')
      .where('agentId', '==', req.player.telegramId)
      .where('status', '==', 'running')
      .get();
    
    const missions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        remainingTimeMs: Math.max(0, data.completesAt - Date.now())
      };
    });

    res.json({ missions });
  } catch (error) {
    console.error('Error fetching active missions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
