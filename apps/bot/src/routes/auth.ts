import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to ensure Firestore is available
const getDb = () => {
  try {
    return getFirestore();
  } catch (err) {
    throw new Error('Firebase not initialized. Make sure initializeApp() was called.');
  }
};

// Helper for OTP storage
const getOtpStore = () => ({
  async set(email: string, code: string, expires: number) {
    await getDb().collection('otp').doc(email).set({ code, expires, createdAt: Date.now() });
  },
  async get(email: string) {
    const doc = await getDb().collection('otp').doc(email).get();
    if (!doc.exists) return null;
    return doc.data() as { code: string; expires: number };
  },
  async delete(email: string) {
    await getDb().collection('otp').doc(email).delete();
  }
});

// Email login
router.post('/api/auth/email-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const db = getDb();
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    if (!user.emailVerified) {
      return res.status(401).json({ success: false, error: 'Email not verified' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const playerDoc = await db.collection('players').doc(user.id).get();
    const player = playerDoc.exists ? playerDoc.data() : null;
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id: user.id, email, firstName: user.firstName, lastName: user.lastName },
      player,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Send OTP
router.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const db = getDb();
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();
    if (!existingUser.empty) {
      const user = existingUser.docs[0].data();
      if (user.emailVerified) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    const otpStore = getOtpStore();
    await otpStore.set(email, code, expires);

    let emailSent = false;
    try {
      await resend.emails.send({
        from: 'World Dominion <noreply@world-dominion.com>',
        to: email,
        subject: 'Verify your email for World Dominion',
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Resend error:', emailError);
    }

    // Return the OTP for debugging (remove in production)
    res.json({
      success: true,
      devCode: code, // <-- temporary: shows the code on the frontend
      emailSent
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// Verify OTP and create account
router.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code, password, firstName, lastName } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const db = getDb();
    const otpStore = getOtpStore();
    const stored = await otpStore.get(email);
    if (!stored || stored.code !== code || stored.expires < Date.now()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired code' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    const userData = {
      id: userId,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    await db.collection('users').doc(userId).set(userData);

    const playerData = {
      userId,
      wallet: { warBonds: 1000, commandPoints: 100 },
      stats: { role: 'CIVILIAN', nation: 'UNASSIGNED', reputation: 50 },
      joinedAt: new Date().toISOString(),
    };
    await db.collection('players').doc(userId).set(playerData);

    await otpStore.delete(email);

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: userId, email, firstName: userData.firstName, lastName: userData.lastName },
      player: playerData,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
