import { Router, Request, Response } from 'express';
import { applyForRole } from '../services/aiRoleService';
import { updatePlayer, db } from '../services/firebaseService';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

/**
 * POST /api/roles/apply
 * Submit role application
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { roleName, nationId, ideology, statement } = req.body;
    if (!roleName || !nationId || !ideology || !statement) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await applyForRole(
      req.player.telegramId,
      roleName,
      nationId,
      ideology,
      statement
    );

    res.json(result);
  } catch (error) {
    console.error('Error applying for role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/roles/available/:nationId
 * Get available roles for a nation
 */
router.get('/available/:nationId', async (req: Request, res: Response) => {
  try {
    const rolesPath = path.join(__dirname, '../../../../data/politics/roles_system.json');
    if (!fs.existsSync(rolesPath)) {
      return res.status(500).json({ error: 'Roles data not found' });
    }

    const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
    
    // Get currently occupied roles in the nation
    const occupiedSnapshot = await db.collection('players')
      .where('nationId', '==', req.params.nationId)
      .get();
    
    const occupiedRoles = occupiedSnapshot.docs.map(doc => doc.data().role);

    // Mark availability
    const availableRoles = rolesData.role_categories.map((category: any) => ({
      ...category,
      roles: category.roles.map((role: any) => ({
        ...role,
        isOccupied: occupiedRoles.includes(role.id)
      }))
    }));

    res.json({ categories: availableRoles });
  } catch (error) {
    console.error('Error fetching available roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/roles/mine
 * Get player's current role
 */
router.get('/mine', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ 
      role: req.player.role,
      nationId: req.player.nationId 
    });
  } catch (error) {
    console.error('Error fetching player role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/roles/resign
 * Resign from current role
 */
router.delete('/resign', async (req: Request, res: Response) => {
  try {
    if (!req.player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await updatePlayer(req.player.telegramId, {
      role: undefined,
      nationId: undefined
    });

    res.json({ success: true, message: 'Resigned from role successfully' });
  } catch (error) {
    console.error('Error resigning from role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
