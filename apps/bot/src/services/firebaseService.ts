import { db, rtdb } from '../lib/firebase-admin';
export { db, rtdb };
import * as fs from 'fs';
import * as path from 'path';

export interface Player {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  nationId?: string;
  currentNation?: string;
  role?: string;
  currentRole?: string;
  stats: {
    totalScore: number;
    warBonds: number;
    commandPoints: number;
    reputation: number;
    militaryKnowledge?: number;
  };
  wallet: {
    warBonds: number;
    commandPoints: number;
  };
  reputation: number;
  kycVerified: boolean;
  joinedAt: number;
  lastActive: number;
  isNPC: boolean;
  referralCount?: number;
  referralCpEarned?: number;
}

export interface Nation {
  id: string;
  name: string;
  flag: string;
  stability: number;
  [key: string]: any;
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  type: 'war' | 'economy' | 'politics' | 'natural_disaster' | 'revolution' | 'political';
  affectedNations: string[];
  effects?: any;
  fromNews?: boolean;
  createdAt?: number;
  expiresAt?: number | null;
}

export const getOrCreatePlayer = async (telegramUser: any): Promise<Player> => {
  const playerRef = db.collection('players').doc(telegramUser.id.toString());
  const doc = await playerRef.get();

  if (doc.exists) {
    return doc.data() as Player;
  }

  const newPlayer = {
    telegramId: telegramUser.id.toString(),
    username: telegramUser.username ?? '',
    firstName: telegramUser.first_name ?? '',
    lastName: telegramUser.last_name ?? '',
    nationId: '',
    currentNation: '',
    role: '',
    currentRole: '',
    stats: {
      totalScore: 0,
      warBonds: 1000,
      commandPoints: 100,
      reputation: 50,
      militaryKnowledge: 0
    },
    wallet: { warBonds: 1000, commandPoints: 100 },
    reputation: 50,
    kycVerified: false,
    isNPC: false,
    joinedAt: Date.now(),
    lastActive: Date.now(),
    referralCount: 0,
    referralCpEarned: 0
  }

  const cleanPlayer = JSON.parse(JSON.stringify(newPlayer))
  await playerRef.set(cleanPlayer)
  return cleanPlayer as Player
};

export const getPlayer = async (telegramId: string): Promise<Player | null> => {
  const doc = await db.collection('players').doc(telegramId).get();
  return doc.exists ? (doc.data() as Player) : null;
};

export const updatePlayer = async (telegramId: string, data: Partial<Player>) => {
  await db.collection('players').doc(telegramId).update({
    ...data,
    lastActive: Date.now(),
  });
};

export const getNation = async (isoCode: string): Promise<Nation | null> => {
  const doc = await db.collection('nations').doc(isoCode.toUpperCase()).get();
  return doc.exists ? (doc.data() as Nation) : null;
};

export const getAllNations = async (): Promise<Nation[]> => {
  const snapshot = await db.collection('nations').orderBy('stability', 'desc').get();
  return snapshot.docs.map(doc => doc.data() as Nation);
};

export const getRecentEvents = async (limit: number = 10): Promise<WorldEvent[]> => {
  const snapshot = await db.collection('events')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => doc.data() as WorldEvent);
};

export const saveWorldEvent = async (event: Omit<WorldEvent, 'id'>) => {
  const eventRef = db.collection('events').doc();
  const eventData = { ...event, id: eventRef.id };
  
  // Save to Firestore
  await eventRef.set(eventData);
  
  // Push to RTDB for live feed
  await rtdb.ref('world_events').push(eventData);
  
  return eventData;
};

export const updateNationRTDB = async (nationId: string, data: any) => {
  await rtdb.ref(`nations/${nationId}`).update(data);
};

export const seedNations = async () => {
  const nationsCount = (await db.collection('nations').count().get()).data().count;
  if (nationsCount > 0) return;

  const nationsPath = path.join(__dirname, '../../../../data/nations/all_countries.json');
  const nationsData = JSON.parse(fs.readFileSync(nationsPath, 'utf8'));

  const batch = db.batch();
  for (const nation of nationsData) {
    const nationRef = db.collection('nations').doc(nation.id);
    batch.set(nationRef, nation);
    
    // Also seed RTDB initial state
    await rtdb.ref(`nations/${nation.id}`).set({
      stability: nation.stability,
      morale: nation.morale,
      atWar: nation.atWarWith.length > 0,
    });
  }
  await batch.commit();
};

export const seedMarketData = async () => {
  const marketCount = (await db.collection('market').count().get()).data().count;
  if (marketCount > 0) return;

  const marketPath = path.join(__dirname, '../../../../data/economics/marketplaces_config.json');
  if (!fs.existsSync(marketPath)) {
    console.error('Market config file not found at:', marketPath);
    return;
  }
  
  const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
  const batch = db.batch();
  
  // Assuming marketData is an array of stocks/commodities
  const stocks = Array.isArray(marketData) ? marketData : (marketData.stocks || []);
  
  for (const stock of stocks) {
    const stockRef = db.collection('market').doc(stock.id || stock.symbol);
    batch.set(stockRef, {
      ...stock,
      currentPrice: stock.basePrice || stock.currentPrice || 100,
      change: 0,
      changePercent: 0,
      lastUpdated: Date.now()
    });
  }
  await batch.commit();
  console.log(`Seeded ${stocks.length} market items.`);
};

export const seedNPCPlayers = async () => {
  // This is a placeholder for creating AI players for unoccupied roles
  // In a real implementation, this would check which nations lack leaders
  console.log('Seeding NPC players...');
};

export const setPlayerOnline = async (telegramId: string, nationId: string, role: string) => {
  const presenceRef = rtdb.ref(`presence/${nationId}/${telegramId}`);
  await presenceRef.set({
    role,
    lastSeen: Date.now(),
    online: true,
  });
  
  // Set up disconnect hook
  await presenceRef.onDisconnect().update({
    online: false,
    lastSeen: Date.now(),
  });
};

export const getLeaderboard = async (limit: number = 10): Promise<Player[]> => {
  const snapshot = await db.collection('players')
    .orderBy('stats.totalScore', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => doc.data() as Player);
};

export const saveTransaction = async (transaction: any) => {
  await db.collection('transactions').add({
    ...transaction,
    timestamp: Date.now(),
  });
};
