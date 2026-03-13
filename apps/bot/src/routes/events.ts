import { Router, Request, Response } from 'express';
import { getRecentEvents, db, rtdb } from '../services/firebaseService';

const router = Router();

/**
 * GET /api/events
 * Get recent events (paginated)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const events = await getRecentEvents(limit);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/events/live
 * SSE stream for live events
 */
router.get('/live', (req: Request, res: Response) => {
  // SSE Setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // RTDB listener for new events
  const eventsRef = rtdb.ref('world_events');
  const listener = eventsRef.limitToLast(1).on('child_added', (snapshot) => {
    const event = snapshot.val();
    // Only send if event is recent (within last 10 seconds) to avoid initial catch-up
    if (event.timestamp > Date.now() - 10000) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });

  // Keep connection alive with heartbeats
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Clean up on close
  req.on('close', () => {
    eventsRef.off('child_added', listener);
    clearInterval(heartbeat);
  });
});

export default router;
