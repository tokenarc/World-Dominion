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

// Helper for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  // Use RTDB instead of Firestore due to quota exhaustion
  const snapshot = await rtdb.ref(`nations/${isoCode.toUpperCase()}`).once('value');
  const data = snapshot.val();
  return data ? (data as Nation) : null;
};

export const getAllNations = async (): Promise<Nation[]> => {
  // Use RTDB instead of Firestore due to quota exhaustion
  return getAllNationsRTDB();
};

export const getAllNationsRTDB = async (): Promise<Nation[]> => {
  console.log("Fetching nations from RTDB...");
  const snapshot = await rtdb.ref('nations').once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.values(data) as Nation[];
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
  console.log('🚀 Starting FORCE seed of 195 nations...');

  const nationsPath = path.join(__dirname, '../../../../data/nations/all_countries.json');
  if (!fs.existsSync(nationsPath)) {
    console.error('❌ Nations data file not found at:', nationsPath);
    return;
  }

  const nationsData = JSON.parse(fs.readFileSync(nationsPath, 'utf8'));
  console.log(`📦 Loaded ${nationsData.length} nations from JSON`);

  // FORCE GLOBAL UPDATE (RTDB): Use .set() on the entire nations node to wipe and replace
  console.log('🧹 Wiping and replacing entire nations node in RTDB...');
  const rtdbNations: Record<string, any> = {};
  
  for (const nation of nationsData) {
    // Clean undefined values
    const cleanNation = JSON.parse(JSON.stringify(nation, (k, v) => 
      v === undefined ? null : v
    ));

    // SILENT NPC SEEDING: Disable all NPC generation, only basic nation info
    rtdbNations[nation.id] = {
      ...cleanNation,
      stability: nation.stability || 50,
      morale: nation.morale || 50,
      atWar: false,
      lastUpdated: Date.now()
    };
  }

  // Set the entire object at once to ensure atomic replacement
  await rtdb.ref('nations').set(rtdbNations);
  console.log(`✅ RTDB nations node replaced with ${Object.keys(rtdbNations).length} entries.`);

  // Firestore seeding disabled due to quota exhaustion
  console.log('🔥 Firestore update SKIPPED (Quota exhausted)');
  
  console.log(`🎉 Total Nations in RTDB: ${Object.keys(rtdbNations).length}`);
  console.log(`🎉 Successfully seeded ${Object.keys(rtdbNations).length} nations into RTDB.`);
};

export const seedMarketData = async () => {
  // Skipping Firestore check due to quota
  console.log('📈 Skipping seedMarketData Firestore check (Quota exhausted)');
  return;
  /*
  const stocksCount = (await db.collection('stocks').count().get()).data().count;
  if (stocksCount > 0) {
    console.log(`📈 Stocks collection already has ${stocksCount} documents. Skipping seed.`);
    return;
  }
  */

  const marketPath = path.join(__dirname, '../../../../data/economics/marketplaces_config.json');
  if (!fs.existsSync(marketPath)) {
    console.error('❌ Market config file not found at:', marketPath);
    return;
  }
  
  const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
  
  const stockExchange = marketData.marketplaces?.find((m: any) => m.id === 'stock_exchange');
  const commodityExchange = marketData.marketplaces?.find((m: any) => m.id === 'commodity_exchange');
  
  const stocks = [
    ...(stockExchange?.companies || []),
    ...(commodityExchange?.commodities || [])
  ];
  
  console.log(`🚀 Starting seed of ${stocks.length} stocks/commodities...`);

  for (const stock of stocks) {
    const stockId = stock.id || stock.symbol;
    if (!stockId) continue;
    
    const stockRef = db.collection('stocks').doc(stockId);
    await stockRef.set({
      ...stock,
      id: stockId,
      currentPrice: stock.basePrice || stock.base_price_wrb || 100,
      change: 0,
      changePercent: 0,
      lastUpdated: Date.now()
    });
    await sleep(20);
  }
  
  console.log(`✅ Successfully seeded ${stocks.length} stocks into 'stocks' collection.`);
};

export const seedNPCPlayers = async () => {
  console.log('🤖 NPC seeding is currently DISABLED.');
};

export const setPlayerOnline = async (telegramId: string, nationId: string, role: string) => {
  const presenceRef = rtdb.ref(`presence/${nationId}/${telegramId}`);
  await presenceRef.set({
    role,
    lastSeen: Date.now(),
    online: true,
  });
  
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
