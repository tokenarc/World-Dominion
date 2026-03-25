import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestore } from 'firebase-admin/firestore';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to ensure Firestore is available
const getDb = () => {
  try {
    return getFirestore();
  } catch (err) {
    throw new Error('Firebase not initialized. Make sure initializeApp() was called.');
  }
};

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
    const userDoc = await usersRef.doc(tid).get();

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
      const user = userDoc.data();
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    const user = userDoc.data();
    const playerDoc = await db.collection('players').doc(user.id).get();
    const player = playerDoc.exists ? playerDoc.data() : null;

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
    if (!user.password) {
      return res.status(401).json({ success: false, error: 'Please use Telegram login' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const playerDoc = await db.collection('players').doc(user.id).get();
    const player = playerDoc.exists ? playerDoc.data() : null;
    const token = jwt.sign({ userId: user.id, email: user.email, telegramId: user.telegramId || null }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId || null,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
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
