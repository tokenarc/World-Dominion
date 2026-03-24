import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://world-dominion-666b1-default-rtdb.firebaseio.com',
      });
      console.log('Firebase Admin initialized with service account');
    } else {
      console.warn('No Firebase service account found. Firestore access may fail.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(authRoutes);

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
