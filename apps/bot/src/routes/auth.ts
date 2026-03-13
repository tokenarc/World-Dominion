import { Router, Request, Response } from 'express';
import { getOrCreatePlayer, getPlayer, updatePlayer } from '../services/firebaseService';

const router = Router();

/**
 * POST /api/auth/validate
 * Validate initData and return player data
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      return res.status(400).json({ error: 'Missing x-telegram-init-data' });
    }

    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    if (!userJson) {
      return res.status(400).json({ error: 'Missing user in initData' });
    }

    const userData = JSON.parse(userJson);
    const player = await getOrCreatePlayer(userData);

    res.json({ player });
  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { initData } = req.body
    if (!initData) {
      return res.status(400).json({ error: 'Missing initData' })
    }

    const urlParams = new URLSearchParams(initData)
    const userJson = urlParams.get('user')
    if (!userJson) {
      return res.status(400).json({ error: 'Missing user data' })
    }

    const userData = JSON.parse(userJson)
    const player = await getOrCreatePlayer(userData)

    res.json({ player, success: true })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/auth/refresh
 * Refresh player data
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const player = await getPlayer(req.player.telegramId);
    res.json({ player });
  } catch (error) {
    console.error('Auth refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
