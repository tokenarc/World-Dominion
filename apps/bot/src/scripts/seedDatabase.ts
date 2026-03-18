import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/\"/g, '')
    }),
    databaseURL: 'https://world-dominion-666b1-default-rtdb.firebaseio.com'
  })
}

const db = admin.firestore()
const rtdb = admin.database()

// Helper for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function seedAll() {
  console.log('🌍 Starting FORCE seed of 195 nations...');
  
  // Load nations data
  const nationsPath = path.join(__dirname, '../../../../data/nations/all_countries.json')
  if (!fs.existsSync(nationsPath)) {
    console.error(`❌ Nations file not found at ${nationsPath}`)
    return
  }
  const nations = JSON.parse(fs.readFileSync(nationsPath, 'utf8'))
  console.log(`📦 Loaded ${nations.length} nations from JSON`)
  
  // FORCE GLOBAL UPDATE (RTDB): Use .set() on the entire nations node to wipe and replace
  console.log('🧹 Wiping and replacing entire nations node in RTDB...')
  const rtdbNations: Record<string, any> = {};
  
  for (const nation of nations) {
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
  
  // Update Firestore in batches
  console.log('🔥 Updating Firestore nations...');
  let count = 0
  for (const nation of nations) {
    const ref = db.collection('nations').doc(nation.id)
    
    const cleanNation = JSON.parse(JSON.stringify(nation, (k, v) => 
      v === undefined ? null : v
    ))
    
    // SILENT NPC SEEDING: No NPCs, just basic nation info
    await ref.set({
      ...cleanNation,
      lastUpdated: Date.now()
    })
    
    count++
    if (count % 20 === 0) {
      console.log(`✅ Firestore: Seeded ${count}/${nations.length} nations...`)
    }
    
    // Small delay to prevent overhead
    await sleep(50)
  }

  // Seed stocks from marketplaces_config.json
  console.log('📈 Seeding stocks...')
  const marketPath = path.join(__dirname, '../../../../data/economics/marketplaces_config.json')
  if (fs.existsSync(marketPath)) {
    const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'))
    if (marketData.stock_exchange?.companies) {
      for (const company of marketData.stock_exchange.companies) {
        const ref = db.collection('stocks').doc(company.id)
        await ref.set({
          ...company,
          currentPrice: company.base_price || 100,
          priceHistory: [company.base_price || 100],
          lastUpdated: Date.now()
        })
        await sleep(20)
      }
      console.log('✅ Stocks seeded!')
    }
  }

  // Seed initial world events
  console.log('📰 Seeding initial events...')
  const events = [
    {
      type: 'political',
      title: 'World Dominion Season 1 Begins',
      description: '195 nations stand ready. The age of conquest begins. Apply for your role now.',
      affectedNations: [],
      effects: { stability_change: 0 },
      fromNews: false,
      timestamp: Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'economic',
      title: 'Global Markets Open',
      description: 'The World Dominion Stock Exchange opens for trading. War Bonds now available.',
      affectedNations: [],
      effects: { gdp_modifier: 1.02 },
      fromNews: false,
      timestamp: Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ]

  for (const event of events) {
    await db.collection('events').add(event)
    await sleep(20)
  }
  console.log('✅ Events seeded!')

  console.log(`🎉 Total Nations in RTDB: ${Object.keys(rtdbNations).length}`)
  console.log(`🎉 DATABASE SEEDING COMPLETE! Total: ${count} nations`)
}

// Only run if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('👋 Seeding script finished')
      process.exit(0)
    })
    .catch(err => {
      console.error('❌ Seeding failed:', err)
      process.exit(1)
    })
}
