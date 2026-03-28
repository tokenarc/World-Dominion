import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';

// ── Route imports ────────────────────────────────────────────
import authRoutes   from './routes/auth';
import warRoutes    from './routes/war';
import walletRoutes from './routes/wallet';
import marketRoutes from './routes/market';
import roleRoutes   from './routes/roles';
import playerRoutes from './routes/player';
import eventRoutes  from './routes/events';
import intelRoutes  from './routes/intel';
import nationRoutes from './routes/nations';
import pingRoutes   from './routes/ping';

// ── Middleware import ─────────────────────────────────────────
import { authMiddleware } from './middleware/auth';

// ── Guard all required env vars at startup ───────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'BOT_TOKEN', 'FIREBASE_SERVICE_ACCOUNT'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

// ── Firebase Admin SDK ───────────────────────────────────────
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://world-dominion-666b1-default-rtdb.firebaseio.com',
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

// ── Express app ──────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 8080;

// ── CORS — whitelist only ────────────────────────────────────
const allowedOrigins = [
  process.env.MINI_APP_URL || '',
  'https://world-dominion-666b1.web.app',
  'https://world-dominion-666b1.firebaseapp.com',
  'https://web.telegram.org',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Telegram WebApp)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser — limit payload size ─────────────────────────
app.use(express.json({ limit: '50kb' }));

// ── Add request ID for tracing ───────────────────────────────
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    Math.random().toString(36).slice(2);
  next();
});

// ── Public routes (no auth) ──────────────────────────────────
app.use('/',           pingRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api/nations', nationRoutes);
app.use('/api/events', eventRoutes);

// ── Market: public GETs, auth on POSTs ──────────────────────
// Apply auth selectively inside market routes (req.player checked there)
app.use('/api/market', marketRoutes);

// ── Protected routes (authMiddleware required) ───────────────
app.use('/api/war',    authMiddleware, warRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use('/api/roles',  authMiddleware, roleRoutes);
app.use('/api/player', authMiddleware, playerRoutes);
app.use('/api/intel',  authMiddleware, intelRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    game: 'World Dominion',
  });
});

// ── Global error handler ─────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[global-error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌍 World Dominion backend running on port ${PORT}`);
  console.log(`📡 Routes: auth, war, wallet, market, roles, player, events, intel, nations`);
});
