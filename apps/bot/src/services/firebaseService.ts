import { db, rtdb } from '../lib/firebase-admin';
export { db, rtdb };
import * as fs from 'fs';
import * as path from 'path';

export interface Player {
  telegramId: string;
  userId: string;
  email: string;
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

export const getOrCreatePlayer = async (userData: any): Promise<Player> => {
  const playerRef = db.collection('players').doc(userData.id);
  const doc = await playerRef.get();

  if (doc.exists) {
    return doc.data() as Player;
  }

  const newPlayer = {
    userId: userData.id,
    email: userData.email || '',
    username: userData.username ?? '',
    firstName: userData.firstName ?? userData.first_name ?? '',
    lastName: userData.lastName ?? userData.last_name ?? '',
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

export const getPlayer = async (userId: string): Promise<Player | null> => {
  const doc = await db.collection('players').doc(userId).get();
  return doc.exists ? (doc.data() as Player) : null;
};

export const updatePlayer = async (userId: string, data: Partial<Player>) => {
  await db.collection('players').doc(userId).update({
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
  if (nationsCount > 0) {
    console.log(`Nations collection already has ${nationsCount} documents. Skipping seed.`);
    return;
  }

  const nationsPath = path.join(__dirname, '../../../../data/nations/all_countries.json');
  if (!fs.existsSync(nationsPath)) {
    console.error('Nations data file not found at:', nationsPath);
    return;
  }

  const nationsData = JSON.parse(fs.readFileSync(nationsPath, 'utf8'));
  console.log(`Starting seed of ${nationsData.length} nations...`);

  // Firestore batch limit is 500 operations
  let batch = db.batch();
  let count = 0;

  for (const nation of nationsData) {
    const nationRef = db.collection('nations').doc(nation.id);
    batch.set(nationRef, nation);
    
    // Also seed RTDB initial state
    await rtdb.ref(`nations/${nation.id}`).set({
      stability: nation.stability,
      morale: nation.morale,
      atWar: nation.atWarWith?.length > 0,
    });

    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`Committed batch of ${count} nations...`);
    }
  }
  
  if (count % 400 !== 0) {
    await batch.commit();
  }
  
  console.log(`Successfully seeded ${count} nations into Firestore and RTDB.`);
};

export const seedMarketData = async () => {
  const stocksCount = (await db.collection('stocks').count().get()).data().count;
  if (stocksCount > 0) {
    console.log(`Stocks collection already has ${stocksCount} documents. Skipping seed.`);
    return;
  }

  const marketPath = path.join(__dirname, '../../../../data/economics/marketplaces_config.json');
  if (!fs.existsSync(marketPath)) {
    console.error('Market config file not found at:', marketPath);
    return;
  }
  
  const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
  const batch = db.batch();
  
  // Extract companies from stock_exchange and commodities from commodity_exchange
  const stockExchange = marketData.marketplaces.find((m: any) => m.id === 'stock_exchange');
  const commodityExchange = marketData.marketplaces.find((m: any) => m.id === 'commodity_exchange');
  
  const stocks = [
    ...(stockExchange?.companies || []),
    ...(commodityExchange?.commodities || [])
  ];
  
  console.log(`Starting seed of ${stocks.length} stocks/commodities...`);

  for (const stock of stocks) {
    const stockId = stock.id || stock.symbol;
    if (!stockId) continue;
    
    const stockRef = db.collection('stocks').doc(stockId);
    batch.set(stockRef, {
      ...stock,
      id: stockId,
      currentPrice: stock.basePrice || stock.base_price_wrb || 100,
      change: 0,
      changePercent: 0,
      lastUpdated: Date.now()
    });
  }
  
  await batch.commit();
  console.log(`Successfully seeded ${stocks.length} stocks into 'stocks' collection.`);
};

export const seedNPCPlayers = async () => {
  // This is a placeholder for creating AI players for unoccupied roles
  // In a real implementation, this would check which nations lack leaders
  console.log('Seeding NPC players...');
};

export const setPlayerOnline = async (userId: string, nationId: string, role: string) => {
  const presenceRef = rtdb.ref(`presence/${nationId}/${userId}`);
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
