import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDv-E0lPe7QmUmpNDJNyE_RsQt_xgqbLKY",
  authDomain: "world-dominion-666b1.firebaseapp.com",
  projectId: "world-dominion-666b1",
  storageBucket: "world-dominion-666b1.firebasestorage.app",
  messagingSenderId: "83883187051",
  appId: "1:83883187051:web:124716ae2d993509124a2e",
  measurementId: "G-PZYYX2JH0Q"
}

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0]

export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export const analytics = typeof window !== 'undefined'
  ? isSupported().then(yes => yes ? getAnalytics(app) : null)
  : null

export default app
