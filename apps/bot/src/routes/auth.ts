import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

// Helper to ensure Firestore is available
const getDb = () => {
  try {
    return getFirestore();
  } catch (err) {
    throw new Error('Firebase not initialized. Make sure initializeApp() was called.');
  }
};

// Validate Telegram WebApp initData hash
const validateTelegramHash = (initData: string): boolean => {
  try {
    // Extract the hash from initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    // Remove hash from params
    params.delete('hash');

    // Sort params by key and create data-check-string
    const dataCheckArray = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);
    const dataCheckString = dataCheckArray.join('\n');

    // Calculate secret key: HMAC-SHA256 of BOT_TOKEN with "WebAppData"
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

    // Calculate hash of data-check-string with secret key
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(dataCheckString);
    const calculatedHash = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash));
  } catch (error) {
    console.error('Hash validation error:', error);
    return false;
  }
};

// Parse initData to extract user info
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

// Telegram WebApp silent authentication
router.post('/api/auth/telegram-verify', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) {
      return res.status(400).json({ success: false, error: 'initData required' });
    }

    // Validate the hash
    if (!validateTelegramHash(initData)) {
      return res.status(401).json({ success: false, error: 'Invalid Telegram authentication' });
    }

    // Parse user data
    const telegramUser = parseInitData(initData);
    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({ success: false, error: 'Invalid user data' });
    }

    const db = getDb();
    const usersRef = db.collection('users');
    const tid = String(telegramUser.id);

    // Check if user exists
    const userDoc = await usersRef.doc(tid).get();

    let isNewUser = false;
    let userData: any;

    if (!userDoc.exists) {
      // New user - create account (no password needed for WebApp auth)
      userData = {
        id: tid,
        telegramId: telegramUser.id,
        password: '', // No password for WebApp users
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
        username: telegramUser.username || '',
        email: '', // Telegram doesn't provide email
        emailVerified: true,
        authMethod: 'telegram_webapp',
        createdAt: new Date().toISOString(),
      };
      await usersRef.doc(tid).set(userData);
      isNewUser = true;
    } else {
      userData = userDoc.data();
      // Update last login or any other fields if needed
      await userDoc.ref.update({
        lastName: telegramUser.last_name || userData.lastName || '',
        username: telegramUser.username || userData.username || '',
      });
    }

    // Get or create player
    const playerDoc = await db.collection('players').doc(tid).get();
    let player: any;

    if (!playerDoc.exists) {
      player = {
        userId: tid,
        telegramId: telegramUser.id,
        email: '',
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        nationId: '',
        currentNation: '',
        role: '',
        currentRole: '',
        wallet: { warBonds: 1000, commandPoints: 100 },
        stats: { totalScore: 0, warBonds: 1000, commandPoints: 100, reputation: 50, militaryKnowledge: 0 },
        reputation: 50,
        kycVerified: false,
        isNPC: false,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        referralCount: 0,
        referralCpEarned: 0
      };
      await db.collection('players').doc(tid).set(player);
    } else {
      player = playerDoc.data();
      // Update last active
      await playerDoc.ref.update({ lastActive: Date.now() });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: tid, telegramId: telegramUser.id, authMethod: 'telegram_webapp' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: userData.id,
        telegramId: userData.telegramId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
      },
      player,
      isNewUser,
    });
  } catch (err) {
    console.error('Telegram verify error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Telegram ID login/registration
router.post('/api/auth/telegram-login', async (req, res) => {
  try {
    const { telegramId, password, firstName, lastName, username } = req.body;
    if (!telegramId || !password) {
      return res.status(400).json({ success: false, error: 'Telegram ID and password required' });
    }

    const db = getDb();
    const usersRef = db.collection('users');
    const tid = String(telegramId);
    // Validate that telegramId is numeric
    if (!/^\d+$/.test(tid)) {
      return res.status(400).json({ success: false, error: 'Invalid telegramId format' });
    }

    // Check if user exists by using telegramId as document ID
    let userDoc = await usersRef.doc(tid).get();

    let isNewUser = false;

    if (!userDoc.exists) {
      // New user - create account
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = tid;

      const userData = {
        id: userId,
        telegramId: tid,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || '',
        email: '', // Optional email field for compatibility
        emailVerified: true, // Skip email verification for Telegram users
        authMethod: 'telegram',
        createdAt: new Date().toISOString(),
      };
      await usersRef.doc(userId).set(userData);
      // Re-fetch the newly created user doc
      userDoc = await usersRef.doc(userId).get();
      isNewUser = true;
    } else {
      // Existing user - verify password
      const userData = userDoc.data();
      if (!userData || !userData.password) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, userData.password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    const user = userDoc.data();
    if (!user) {
      return res.status(500).json({ success: false, error: 'User data not found' });
    }
    const playerDoc = await db.collection('players').doc(user.id).get();
    let player = playerDoc.exists ? playerDoc.data() : null;

    // Create player if doesn't exist (for both new and existing users)
    if (!player) {
      const playerData = {
        userId: user.id,
        telegramId: user.telegramId,
        email: user.email || '',
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nationId: '',
        currentNation: '',
        role: '',
        currentRole: '',
        wallet: { warBonds: 1000, commandPoints: 100 },
        stats: { totalScore: 0, warBonds: 1000, commandPoints: 100, reputation: 50, militaryKnowledge: 0 },
        reputation: 50,
        kycVerified: false,
        isNPC: false,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        referralCount: 0,
        referralCpEarned: 0
      };
      await db.collection('players').doc(user.id).set(playerData);
      // If this was a new player, return it directly
      if (isNewUser) {
        const token = jwt.sign({ userId: user.id, telegramId: user.telegramId }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            telegramId: user.telegramId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
          },
          player: playerData,
        });
      }
      // If existing user, refresh player reference
      player = playerData;
    }

    const token = jwt.sign({ userId: user.id, telegramId: user.telegramId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      },
      player: player || null,
    });
  } catch (err) {
    console.error('Telegram login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Legacy email login (kept for backward compatibility)
router.post('/api/auth/email-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const db = getDb();
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: 'Please use Telegram login' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const playerDoc = await db.collection('players').doc(user.id).get();
    const player = playerDoc.exists ? playerDoc.data() : null;
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      telegramId: user.telegramId || null
    }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId || null,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || ''
      },
      player,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
