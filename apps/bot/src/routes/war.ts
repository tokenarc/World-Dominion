import { Router, Request, Response } from 'express';
import { db } from '../services/firebaseService';

const router = Router();

/**
 * POST /api/war/declare
 * Declare war
 */
router.post('/declare', async (req: Request, res: Response) => {
  try {
    if (!req.player || !req.player.nationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetNationId } = req.body;
    if (!targetNationId) {
      return res.status(400).json({ error: 'Missing targetNationId' });
    }

    const allowedRoles = ['supreme_commander', 'general', 'president', 'prime_minister'];
    if (!allowedRoles.includes(req.player.role || '')) {
      return res.status(403).json({ error: 'Only high-ranking leaders can declare war' });
    }

    // War declaration logic (similar to handleWarAction)
    const warRef = db.collection('wars').doc();
    const warData = {
      id: warRef.id,
      attacker: req.player.nationId,
      defender: targetNationId,
      status: 'active',
      startedAt: Date.now(),
      currentRound: 1
    };

    await warRef.set(warData);

    // Update nations' atWarWith status
    const attackerRef = db.collection('nations').doc(req.player.nationId);
    const defenderRef = db.collection('nations').doc(targetNationId);

    await db.runTransaction(async (transaction) => {
      const attackerDoc = await transaction.get(attackerRef);
      const defenderDoc = await transaction.get(defenderRef);

      if (attackerDoc.exists && defenderDoc.exists) {
        const attackerData = attackerDoc.data()!;
        const defenderData = defenderDoc.data()!;

        transaction.update(attackerRef, {
          atWarWith: Array.from(new Set([...(attackerData.atWarWith || []), targetNationId]))
        });

        transaction.update(defenderRef, {
          atWarWith: Array.from(new Set([...(defenderData.atWarWith || []), req.player!.nationId]))
        });
      }
    });

    res.json({ success: true, warId: warRef.id });
  } catch (error) {
    console.error('Error declaring war:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/war/peace
 * Propose peace
 */
router.post('/peace', async (req: Request, res: Response) => {
  try {
    if (!req.player || !req.player.nationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetNationId, terms } = req.body;
    if (!targetNationId) {
      return res.status(400).json({ error: 'Missing targetNationId' });
    }

    // Placeholder for peace proposal logic
    const peaceProposalRef = db.collection('peaceProposals').doc();
    await peaceProposalRef.set({
      id: peaceProposalRef.id,
      proposerNationId: req.player.nationId,
      targetNationId,
      terms: terms || 'Standard peace treaty',
      status: 'pending',
      timestamp: Date.now()
    });

    res.json({ success: true, proposalId: peaceProposalRef.id });
  } catch (error) {
    console.error('Error proposing peace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/war/coalition/join
 * Join coalition
 */
router.post('/coalition/join', async (req: Request, res: Response) => {
  try {
    if (!req.player || !req.player.nationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { coalitionId } = req.body;
    if (!coalitionId) {
      return res.status(400).json({ error: 'Missing coalitionId' });
    }

    // Placeholder for coalition logic
    res.json({ success: true, message: `Successfully joined coalition ${coalitionId}` });
  } catch (error) {
    console.error('Error joining coalition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/war/active
 * Get all active wars
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('wars')
      .where('status', '==', 'active')
      .orderBy('startedAt', 'desc')
      .get();
    
    const wars = snapshot.docs.map(doc => doc.data());
    res.json({ wars });
  } catch (error) {
    console.error('Error fetching active wars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
