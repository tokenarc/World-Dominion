import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPlayer, Player } from '../services/firebaseService';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

declare global {
  namespace Express {
    interface Request {
      player?: Player;
    }
  }
}

// Simple in-memory rate limiter — no axios, no external calls
const RATE_LIMIT_WINDOW_MS  = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now     = Date.now();
  const rateData = ipRequestCounts.get(ip);
  if (rateData && now < rateData.resetTime) {
    rateData.count++;
    return rateData.count > MAX_REQUESTS_PER_WINDOW;
  }
  ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  return false;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now > data.resetTime) ipRequestCounts.delete(ip);
  }
}, 5 * 60 * 1000);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'unknown';

  // Rate limit
  if (checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // JWT check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
    const player  = await getPlayer(decoded.userId);

    if (!player) {
      return res.status(401).json({ error: 'Unauthorized: Player not found' });
    }

    req.player = player;
    next();
  } catch (err) {
    console.error('[auth middleware]', err);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
