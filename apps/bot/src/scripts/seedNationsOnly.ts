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

export async function seedNationsOnly() {
  console.log('🌍 Starting FORCE seed of 195 nations (Nations only, NO NPCs)...');
  
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
  
  // Firestore update SKIPPED due to quota exhaustion
  console.log('🔥 Firestore update SKIPPED (Quota exhausted)');

  console.log(`🎉 Total Nations in RTDB: ${Object.keys(rtdbNations).length}`)
  console.log(`🎉 DATABASE SEEDING COMPLETE! Total: ${Object.keys(rtdbNations).length} nations in RTDB`)
}

seedNationsOnly()
  .then(() => {
    console.log('👋 Seeding script finished')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })
