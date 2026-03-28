import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

const router = Router();

// ── Guard env vars — fail fast, never use fallback secrets ───
const JWT_SECRET = process.env.JWT_SECRET;
const BOT_TOKEN  = process.env.BOT_TOKEN;

if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');
if (!BOT_TOKEN)  throw new Error('BOT_TOKEN env var is required');

const getDb = () => {
  try {
    return getFirestore();
  } catch {
    throw new Error('Firebase not initialized');
  }
};

// ── Telegram initData HMAC validation ────────────────────────
const validateTelegramHash = (initData: string): boolean => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN!)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Both buffers must be same length for timingSafeEqual
    if (calculatedHash.length !== hash.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash),
      Buffer.from(hash)
    );
  } catch {
    return false;
  }
};

const parseInitData = (initData: string): any => {
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// ── POST /api/auth/telegram-verify ───────────────────────────
// Called by miniapp on every load — silent auth via Telegram WebApp
router.post('/telegram-verify', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ success: false, error: 'initData required' });
    }

    if (!validateTelegramHash(initData)) {
      return res.status(401).json({ success: false, error: 'Invalid Telegram authentication' });
    }

    const telegramUser = parseInitData(initData);
    if (!telegramUser?.id) {
      return res.status(400).json({ success: false, error: 'Invalid user data in initData' });
    }

    const db  = getDb();
    const tid = String(telegramUser.id);

    // Upsert user
    const userRef = db.collection('users').doc(tid);
    const userDoc = await userRef.get();
    let isNewUser = false;

    if (!userDoc.exists) {
      isNewUser = true;
      await userRef.set({
        id:            tid,
        telegramId:    telegramUser.id,
        firstName:     telegramUser.first_name || '',
        lastName:      telegramUser.last_name  || '',
        username:      telegramUser.username   || '',
        email:         '',
        emailVerified: true,
        authMethod:    'telegram_webapp',
        createdAt:     new Date().toISOString(),
      });
    } else {
      await userRef.update({
        lastName: telegramUser.last_name  || userDoc.data()?.lastName  || '',
        username: telegramUser.username   || userDoc.data()?.username  || '',
        lastLogin: new Date().toISOString(),
      });
    }

    const userData = isNewUser
      ? (await userRef.get()).data()!
      : userDoc.data()!;

    // Upsert player
    const playerRef = db.collection('players').doc(tid);
    const playerDoc = await playerRef.get();
    let player: any;

    if (!playerDoc.exists) {
      player = {
        userId:         tid,
        telegramId:     telegramUser.id,
        username:       userData.username,
        firstName:      userData.firstName,
        lastName:       userData.lastName,
        nationId:       '',
        currentNation:  '',
        role:           '',
        currentRole:    '',
        wallet:         { warBonds: 1000, commandPoints: 100 },
        stats:          { totalScore: 0, warBonds: 1000, commandPoints: 100, reputation: 50, militaryKnowledge: 0 },
        reputation:     50,
        kycVerified:    false,
        isNPC:          false,
        joinedAt:       Date.now(),
        lastActive:     Date.now(),
        referralCount:  0,
        referralCpEarned: 0,
      };
      await playerRef.set(player);
    } else {
      player = playerDoc.data();
      await playerRef.update({ lastActive: Date.now() });
    }

    const token = jwt.sign(
      { userId: tid, telegramId: telegramUser.id, authMethod: 'telegram_webapp' },
      JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id:         userData.id,
        telegramId: userData.telegramId,
        firstName:  userData.firstName,
        lastName:   userData.lastName,
        username:   userData.username,
      },
      player,
      isNewUser,
    });
  } catch (err) {
    console.error('[telegram-verify]', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ── POST /api/auth/telegram-login ────────────────────────────
// Manual login with telegramId + password (legacy flow)
router.post('/telegram-login', async (req, res) => {
  try {
    const { telegramId, password, firstName, lastName, username } = req.body;

    if (!telegramId || !password) {
      return res.status(400).json({ success: false, error: 'telegramId and password required' });
    }

    const tid = String(telegramId);
    if (!/^\d+$/.test(tid)) {
      return res.status(400).json({ success: false, error: 'Invalid telegramId format' });
    }

    const db      = getDb();
    const userRef = db.collection('users').doc(tid);
    let userDoc   = await userRef.get();
    let isNewUser = false;

    if (!userDoc.exists) {
      isNewUser = true;
      const hashedPassword = await bcrypt.hash(password, 12);
      await userRef.set({
        id:            tid,
        telegramId:    tid,
        password:      hashedPassword,
        firstName:     firstName || '',
        lastName:      lastName  || '',
        username:      username  || '',
        email:         '',
        emailVerified: true,
        authMethod:    'telegram',
        createdAt:     new Date().toISOString(),
      });
      userDoc = await userRef.get();
    } else {
      const userData = userDoc.data();
      if (!userData?.password) {
        return res.status(401).json({ success: false, error: 'Use Telegram WebApp auth instead' });
      }
      const valid = await bcrypt.compare(password, userData.password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    const user = userDoc.data()!;

    // Upsert player
    const playerRef = db.collection('players').doc(tid);
    const playerDoc = await playerRef.get();
    let player: any;

    if (!playerDoc.exists) {
      player = {
        userId:         tid,
        telegramId:     tid,
        username:       user.username || '',
        firstName:      user.firstName || '',
        lastName:       user.lastName  || '',
        nationId:       '',
        currentNation:  '',
        role:           '',
        currentRole:    '',
        wallet:         { warBonds: 1000, commandPoints: 100 },
        stats:          { totalScore: 0, warBonds: 1000, commandPoints: 100, reputation: 50, militaryKnowledge: 0 },
        reputation:     50,
        kycVerified:    false,
        isNPC:          false,
        joinedAt:       Date.now(),
        lastActive:     Date.now(),
        referralCount:  0,
        referralCpEarned: 0,
      };
      await playerRef.set(player);
    } else {
      player = playerDoc.data();
      await playerRef.update({ lastActive: Date.now() });
    }

    const token = jwt.sign(
      { userId: tid, telegramId: tid },
      JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id:         user.id,
        telegramId: user.telegramId,
        firstName:  user.firstName,
        lastName:   user.lastName,
        username:   user.username,
      },
      player,
      isNewUser,
    });
  } catch (err) {
    console.error('[telegram-login]', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ── POST /api/auth/verify-token ──────────────────────────────
// Called by miniapp on load to validate stored JWT
router.post('/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET!);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
