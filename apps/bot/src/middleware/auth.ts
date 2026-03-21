import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { getPlayer, Player } from '../services/firebaseService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request type to include player
declare global {
  namespace Express {
    interface Request {
      player?: Player;
    }
  }
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();



/**
 * Block VPN/proxy via ip-api.com check
 */
const isProxy = async (ip: string): Promise<boolean> => {
  try {
    // ip-api.com free tier doesn't support HTTPS, using HTTP
    // Also note: 45 requests per minute limit for free tier
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting,vpn`);
    return response.data.proxy || response.data.hosting || response.data.vpn;
  } catch (error) {
    console.error('Error checking proxy status:', error);
    return false; // Default to allow if check fails
  }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  // 1. Rate Limiting
  const now = Date.now();
  const rateData = ipRequestCounts.get(ip);

  if (rateData && now < rateData.resetTime) {
    rateData.count++;
    if (rateData.count > MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  } else {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  // 2. VPN/Proxy Check
  const proxyBlocked = await isProxy(ip);
  if (proxyBlocked) {
    return res.status(403).json({ error: 'Access denied: VPN/Proxy detected' });
  }

  // 3. Auth Validation (JWT)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  // 4. Attach Player Data
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const player = await getPlayer(decoded.userId);

    if (!player) {
      return res.status(401).json({ error: 'Unauthorized: Player not found' });
    }

    req.player = player;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
