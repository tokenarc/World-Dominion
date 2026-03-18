import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  databaseURL: 'https://world-dominion-666b1-default-rtdb.firebaseio.com'
})

const db = admin.firestore()
const rtdb = admin.database()

async function seedAll() {
  console.log('🌍 Seeding 195 nations...')
  
  // Load nations data
  const nationsPath = path.join(__dirname, '../../../../data/nations/all_countries.json')
  const nations = JSON.parse(fs.readFileSync(nationsPath, 'utf8'))
  
  // Check count
  const existing = await db.collection('nations').count().get()
  if (existing.data().count > 0) {
    console.log(`Nations already seeded: ${existing.data().count}`)
  }

  // Batch write — 500 at a time
  const batchSize = 400
  for (let i = 0; i < nations.length; i += batchSize) {
    const batch = db.batch()
    const chunk = nations.slice(i, i + batchSize)
    
    for (const nation of chunk) {
      const ref = db.collection('nations').doc(nation.id)
      // Clean undefined values
      const cleanNation = JSON.parse(JSON.stringify(nation, (k, v) => 
        v === undefined ? null : v
      ))
      batch.set(ref, cleanNation)
      
      // Also seed RTDB for live state
      await rtdb.ref(`nations/${nation.id}`).set({
        stability: nation.stability || 50,
        morale: nation.morale || 50,
        atWar: false,
        lastUpdated: Date.now()
      })
    }
    
    await batch.commit()
    console.log(`✅ Seeded ${Math.min(i + batchSize, nations.length)}/${nations.length} nations`)
  }

  // Seed stocks from marketplaces_config.json
  console.log('📈 Seeding stocks...')
  const marketPath = path.join(__dirname, '../../../../data/economics/marketplaces_config.json')
  const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'))
  
  if (marketData.stock_exchange?.companies) {
    const batch = db.batch()
    for (const company of marketData.stock_exchange.companies) {
      const ref = db.collection('stocks').doc(company.id)
      batch.set(ref, {
        ...company,
        currentPrice: company.base_price || 100,
        priceHistory: [company.base_price || 100],
        lastUpdated: Date.now()
      })
    }
    await batch.commit()
    console.log('✅ Stocks seeded!')
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
  }
  console.log('✅ Events seeded!')

  console.log('🎉 DATABASE SEEDING COMPLETE!')
  process.exit(0)
}

seedAll().catch(console.error)
