import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Groq from 'groq-sdk'
import axios from 'axios'

admin.initializeApp()
const db = admin.firestore()
const rtdb = admin.database()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
const BOT_TOKEN = process.env.BOT_TOKEN || ''
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// ================================================================
// HELPER FUNCTIONS
// ================================================================

async function sendTelegramMessage(chatId: string, text: string) {
  try {
    await axios.post(`${BOT_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  } catch (e) {
    console.error('Telegram send error:', e)
  }
}

async function callGroq(prompt: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    })
    return response.choices[0]?.message?.content || ''
  } catch (e) {
    console.error('Groq error:', e)
    return ''
  }
}

// ================================================================
// FUNCTION 1: NEWS LOOP — every 30 minutes
// ================================================================

export const newsLoop = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async () => {
    console.log('📰 Running news loop...')

    const queries = [
      { q: 'war military attack invasion', type: 'military', emoji: '⚔️' },
      { q: 'sanctions economy inflation crisis', type: 'economic', emoji: '📉' },
      { q: 'election president coup protest', type: 'political', emoji: '🗳️' },
      { q: 'nuclear missile test ICBM', type: 'nuclear', emoji: '☢️' },
      { q: 'earthquake flood hurricane disaster', type: 'disaster', emoji: '🌪️' }
    ]

    for (const query of queries) {
      try {
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query.q)}&mode=artlist&maxrecords=2&format=json`
        const res = await axios.get(url, { timeout: 8000 })
        const articles = res.data?.articles || []

        for (const article of articles.slice(0, 1)) {
          const prompt = `Convert this real news to a World Dominion game event. Article: "${article.title}". Return ONLY valid JSON no markdown: {"type":"${query.type}","title":"game event title max 8 words","description":"engaging description max 25 words","affectedNations":["ISO_codes"],"effects":{"stability_change":-3,"gdp_modifier":1.0}}`

          const result = await callGroq(prompt)
          try {
            const clean = result.replace(/```json|```/g, '').trim()
            const event = JSON.parse(clean)
            event.fromNews = true
            event.createdAt = admin.firestore.FieldValue.serverTimestamp()
            event.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

            const ref = await db.collection('events').add(event)

            // Push to Realtime DB for live feed
            await rtdb.ref(`liveEvents/${ref.id}`).set({
              ...event,
              createdAt: Date.now()
            })

            // Apply effects to affected nations
            if (event.affectedNations?.length > 0) {
              for (const nationId of event.affectedNations) {
                const nationRef = db.collection('nations').doc(nationId)
                const updates: any = {}
                if (event.effects?.stability_change) {
                  updates.stability = admin.firestore.FieldValue.increment(event.effects.stability_change)
                }
                if (Object.keys(updates).length > 0) {
                  await nationRef.update(updates).catch(() => {})
                }
              }
            }

            console.log(`✅ Event created: ${event.title}`)
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr)
          }
        }
      } catch (fetchErr) {
        console.error(`News fetch error for ${query.type}:`, fetchErr)
      }
    }
    return null
  })

// ================================================================
// FUNCTION 2: ECONOMY TICK — every 6 hours
// ================================================================

export const economyTick = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    console.log('💰 Running economy tick...')

    try {
      // Sync GDP from World Bank
      const wbUrl = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&mrv=1&per_page=300'
      const wbRes = await axios.get(wbUrl, { timeout: 15000 })
      const wbData = wbRes.data?.[1] || []

      const batch = db.batch()
      let updateCount = 0

      for (const entry of wbData) {
        if (entry?.countryiso3code && entry?.value) {
          const isoCode = entry.countryiso3code
          const gdpMillions = Math.round(entry.value / 1000000)
          const nationRef = db.collection('nations').doc(isoCode)
          batch.update(nationRef, {
            gdp: gdpMillions,
            lastGdpSync: admin.firestore.FieldValue.serverTimestamp()
          })
          updateCount++
          if (updateCount >= 400) break
        }
      }

      await batch.commit().catch(() => {})
      console.log(`✅ GDP synced for ${updateCount} nations`)

      // Update stock prices based on recent events
      const recentEvents = await db.collection('events')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

      const stocks = await db.collection('stocks').get()

      for (const stockDoc of stocks.docs) {
        const stock = stockDoc.data()
        let priceChange = (Math.random() - 0.5) * 4 // base volatility

        // Apply event effects
        recentEvents.docs.forEach(eventDoc => {
          const event = eventDoc.data()
          if (stock.eventTriggers?.includes(event.type)) {
            priceChange += stock.volatility === 'very_high' ? 8 : 4
          }
        })

        const newPrice = Math.max(1, stock.currentPrice + priceChange)
        const priceHistory = [...(stock.priceHistory || [stock.basePrice]), newPrice].slice(-30)

        await stockDoc.ref.update({ currentPrice: newPrice, priceHistory })
        await rtdb.ref(`stockPrices/${stockDoc.id}`).set(newPrice)
      }

      // Update global state
      await rtdb.ref('liveState').update({
        lastEconomyTick: Date.now()
      })

    } catch (e) {
      console.error('Economy tick error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 3: WAR ROUND RESOLVER — every 6 hours
// ================================================================

export const warRoundResolver = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    console.log('⚔️ Resolving war rounds...')

    try {
      const activeWars = await db.collection('wars')
        .where('status', '==', 'active')
        .get()

      for (const warDoc of activeWars.docs) {
        const war = warDoc.data()

        // Get nation stats
        const [aggressorDoc, defenderDoc] = await Promise.all([
          db.collection('nations').doc(war.aggressor).get(),
          db.collection('nations').doc(war.defender).get()
        ])

        const aggressor = aggressorDoc.data() || {}
        const defender = defenderDoc.data() || {}

        // Calculate battle round
        const aggressorAttack = (aggressor.militaryStrength || 50) * ((aggressor.morale || 50) / 100) + Math.random() * 10
        const defenderDefense = (defender.militaryStrength || 50) * ((defender.morale || 50) / 100) * 1.15 + Math.random() * 10

        const roundScore = Math.min(15, Math.max(-15, aggressorAttack - defenderDefense))
        const newWarScore = Math.min(100, Math.max(0, (war.warScore || 50) + roundScore))
        const newRound = (war.currentRound || 0) + 1

        // Update casualties
        const aggressorCasualties = Math.round(aggressor.activePersonnel * 0.01 * Math.random())
        const defenderCasualties = Math.round(defender.activePersonnel * 0.01 * Math.random())

        await warDoc.ref.update({
          warScore: newWarScore,
          currentRound: newRound,
          'casualties.aggressor': admin.firestore.FieldValue.increment(aggressorCasualties),
          'casualties.defender': admin.firestore.FieldValue.increment(defenderCasualties)
        })

        // Update nation morale
        await aggressorDoc.ref.update({
          morale: admin.firestore.FieldValue.increment(-2)
        }).catch(() => {})

        await defenderDoc.ref.update({
          morale: admin.firestore.FieldValue.increment(-1)
        }).catch(() => {})

        // Check victory condition
        if (newWarScore >= 100) {
          await warDoc.ref.update({ status: 'ended', winner: war.aggressor })
          await aggressorDoc.ref.update({ occupationLevel: 'occupied' })
          await defenderDoc.ref.update({ occupiedBy: war.aggressor, occupationLevel: 'occupied', resistanceMeter: 0 })

          // Post world event
          await db.collection('events').add({
            type: 'military',
            title: `${aggressor.name || war.aggressor} has defeated ${defender.name || war.defender}`,
            description: `After ${newRound} battle rounds, ${aggressor.flag || ''} ${aggressor.name || war.aggressor} achieves military victory. Occupation begins.`,
            affectedNations: [war.aggressor, war.defender],
            effects: { stability_change: -10 },
            fromNews: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
          })

          console.log(`🏆 War ended: ${war.aggressor} defeated ${war.defender}`)
        }

        // Update live state
        await rtdb.ref(`activeBattles/${warDoc.id}`).update({
          warScore: newWarScore,
          currentRound: newRound,
          lastUpdated: Date.now()
        })
      }
    } catch (e) {
      console.error('War resolver error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 4: ELECTION CHECKER — every 24 hours
// ================================================================

export const electionChecker = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    console.log('🗳️ Checking elections...')

    try {
      const eligibleGovTypes = ['liberal_democracy','fragile_democracy','parliamentary','semi_presidential','islamic_republic']

      const nations = await db.collection('nations')
        .where('governmentType', 'in', eligibleGovTypes)
        .get()

      for (const nationDoc of nations.docs) {
        const nation = nationDoc.data()
        const lastElection = nation.lastElection?.toDate?.() || new Date(0)
        const daysSince = (Date.now() - lastElection.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSince >= 30) {
          // Check if election already active
          const existing = await db.collection('elections')
            .where('nationId', '==', nationDoc.id)
            .where('status', '==', 'active')
            .get()

          if (existing.empty) {
            await db.collection('elections').add({
              nationId: nationDoc.id,
              candidates: [],
              votes: {},
              status: 'active',
              startedAt: admin.firestore.FieldValue.serverTimestamp(),
              endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              winnerId: null,
              isCoupAttempted: false
            })

            await db.collection('events').add({
              type: 'political',
              title: `Elections called in ${nation.name}`,
              description: `${nation.flag || ''} ${nation.name} holds democratic elections. Apply as candidate now.`,
              affectedNations: [nationDoc.id],
              effects: { stability_change: 2 },
              fromNews: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            })

            console.log(`🗳️ Election started in ${nation.name}`)
          }
        }
      }

      // Close expired elections
      const expiredElections = await db.collection('elections')
        .where('status', '==', 'active')
        .where('endsAt', '<=', new Date())
        .get()

      for (const electionDoc of expiredElections.docs) {
        const election = electionDoc.data()
        const votes = election.votes || {}
        const winner = Object.entries(votes).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || null

        await electionDoc.ref.update({ status: 'completed', winnerId: winner })

        if (winner) {
          await db.collection('players').doc(winner).update({
            currentRole: 'president'
          }).catch(() => {})
        }

        console.log(`🗳️ Election closed. Winner: ${winner}`)
      }
    } catch (e) {
      console.error('Election checker error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 5: NPC DECISION CYCLE — every 6 hours
// ================================================================

export const npcDecisionCycle = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    console.log('🤖 Running NPC decision cycle...')

    try {
      const npcPlayers = await db.collection('players')
        .where('isNPC', '==', true)
        .limit(20)
        .get()

      const recentEventsSnap = await db.collection('events')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()

      const latestEvent = recentEventsSnap.docs[0]?.data() || { title: 'World is stable', description: 'No major events' }

      for (const npcDoc of npcPlayers.docs) {
        const npc = npcDoc.data()
        if (!npc.currentNation || !npc.currentRole) continue

        const nationDoc = await db.collection('nations').doc(npc.currentNation).get()
        const nation = nationDoc.data() || {}

        const prompt = `You are the ${npc.currentRole} of ${nation.name || npc.currentNation} in World Dominion game. Nation stats: GDP=${nation.gdp || 0}B, Stability=${nation.stability || 50}/100, Military=${nation.militaryStrength || 50}/100, Ideology=${nation.ideology || 'unknown'}. Recent event: ${latestEvent.title}. Personality: ${npc.npcPersonality || 'realist'}. Choose ONE action: increase_military_budget, improve_diplomacy, boost_economy, do_nothing, send_aid, impose_sanctions. Return ONLY JSON: {"decision":"chosen_action","reasoning":"max 10 words","target":null}`

        const result = await callGroq(prompt)

        try {
          const clean = result.replace(/```json|```/g, '').trim()
          const decision = JSON.parse(clean)

          await db.collection('npcDecisions').add({
            nationId: npc.currentNation,
            role: npc.currentRole,
            npcId: npcDoc.id,
            decision: decision.decision,
            reasoning: decision.reasoning,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          })

          // Apply simple decision effects
          if (decision.decision === 'boost_economy') {
            await nationDoc.ref.update({ gdp: admin.firestore.FieldValue.increment(100) })
          } else if (decision.decision === 'improve_diplomacy') {
            await nationDoc.ref.update({ stability: admin.firestore.FieldValue.increment(1) })
          } else if (decision.decision === 'increase_military_budget') {
            await nationDoc.ref.update({ militaryStrength: admin.firestore.FieldValue.increment(1) })
          }

        } catch (e) {
          console.error('NPC decision parse error:', e)
        }
      }
    } catch (e) {
      console.error('NPC cycle error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 6: RESISTANCE CHECKER — every 6 hours
// ================================================================

export const resistanceChecker = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    console.log('🔥 Checking resistance meters...')

    try {
      const occupiedNations = await db.collection('nations')
        .where('occupationLevel', 'in', ['occupied', 'annexed', 'puppet'])
        .get()

      for (const nationDoc of occupiedNations.docs) {
        const nation = nationDoc.data()
        const currentResistance = nation.resistanceMeter || 0
        const newResistance = Math.min(100, currentResistance + 2)

        await nationDoc.ref.update({ resistanceMeter: newResistance })

        // Liberation event
        if (newResistance >= 100) {
          await nationDoc.ref.update({
            occupationLevel: 'none',
            occupiedBy: null,
            resistanceMeter: 0,
            stability: admin.firestore.FieldValue.increment(15)
          })

          await db.collection('events').add({
            type: 'military',
            title: `${nation.name} achieves liberation!`,
            description: `${nation.flag || ''} ${nation.name} resistance reaches critical mass. Occupation collapses. Nation declares independence.`,
            affectedNations: [nationDoc.id],
            effects: { stability_change: 15 },
            fromNews: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
          })

          console.log(`🎉 Liberation: ${nation.name}`)
        }
      }
    } catch (e) {
      console.error('Resistance checker error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 7: WORLD GAZETTE — every 24 hours at 8 AM UTC
// ================================================================

export const worldGazette = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('📰 Publishing World Dominion Gazette...')

    try {
      const events = await db.collection('events')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

      const eventsData = events.docs.map(d => d.data())
      const eventsJson = JSON.stringify(eventsData.map(e => ({ title: e.title, type: e.type, description: e.description })))

      const prompt = `You are editor of World Dominion Gazette — official newspaper of a geopolitical strategy game with 195 nations and real players. Today's events: ${eventsJson}. Write a short dramatic newspaper in Telegram format. Include: 📰 HEADLINE (1 sentence), 📊 ECONOMIC BRIEF (1 sentence with numbers), 🕵️ INTEL LEAK (mysterious 1 sentence), 🗣️ OPINION (1 sentence from any ideology), ⚡ 3 BULLET NEWS. Use emojis. Keep total under 300 words. Make it dramatic and engaging.`

      const gazette = await callGroq(prompt)

      if (gazette) {
        const gazetteText = `📰 *WORLD DOMINION GAZETTE*\n_${new Date().toDateString()}_\n\n${gazette}`

        // Post to main channel if configured
        const mainChannelId = functions.config().bot?.channel_id
        if (mainChannelId) {
          await sendTelegramMessage(mainChannelId, gazetteText)
        }

        // Save to Firestore
        await db.collection('gazette').add({
          content: gazetteText,
          publishedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        console.log('✅ Gazette published')
      }
    } catch (e) {
      console.error('Gazette error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 8: CLEANUP — every 24 hours
// ================================================================

export const cleanupExpired = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    console.log('🧹 Running cleanup...')

    try {
      const now = new Date()

      // Delete expired events
      const expiredEvents = await db.collection('events')
        .where('expiresAt', '<=', now)
        .limit(100)
        .get()

      const batch = db.batch()
      expiredEvents.docs.forEach(doc => batch.delete(doc.ref))

      // Delete expired market listings
      const expiredListings = await db.collection('marketListings')
        .where('status', '==', 'active')
        .where('expiresAt', '<=', now)
        .limit(50)
        .get()

      expiredListings.docs.forEach(doc => batch.update(doc.ref, { status: 'expired' }))

      await batch.commit()
      console.log(`✅ Cleaned ${expiredEvents.size} events, ${expiredListings.size} listings`)

    } catch (e) {
      console.error('Cleanup error:', e)
    }

    return null
  })

// ================================================================
// FUNCTION 9: DAILY MISSIONS — every 24 hours at 6 AM UTC
// ================================================================

export const dailyMissions = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('🎯 Generating daily missions...')

    try {
      const missionsByRole: Record<string, any[]> = {
        military: [
          { id: 'train_troops', title: 'Train your troops', reward_cp: 200, description: 'Increase military budget by any amount' },
          { id: 'war_ready', title: 'War Readiness Check', reward_cp: 150, description: 'View your nation military status' },
          { id: 'alliance_check', title: 'Check Alliance Status', reward_cp: 100, description: 'Review your active alliances' }
        ],
        political: [
          { id: 'diplomatic_message', title: 'Send Diplomatic Message', reward_cp: 200, description: 'Contact another nation leader' },
          { id: 'stability_check', title: 'National Stability Review', reward_cp: 150, description: 'Check your nation stability score' },
          { id: 'un_presence', title: 'UN Presence', reward_cp: 100, description: 'Review current UN resolutions' }
        ],
        economic: [
          { id: 'market_check', title: 'Market Analysis', reward_cp: 200, description: 'Check stock market prices' },
          { id: 'gdp_review', title: 'GDP Review', reward_cp: 150, description: 'Review your nation GDP' },
          { id: 'trade_opportunity', title: 'Find Trade Opportunity', reward_cp: 100, description: 'Browse commodity exchange' }
        ],
        default: [
          { id: 'world_events', title: 'Read World Events', reward_cp: 100, description: 'Check recent world events' },
          { id: 'leaderboard_check', title: 'Check Leaderboard', reward_cp: 100, description: 'View top commanders' },
          { id: 'profile_update', title: 'Review Your Profile', reward_cp: 50, description: 'Check your commander stats' }
        ]
      }

      const today = new Date().toISOString().split('T')[0]

      // Get all human players
      const players = await db.collection('players')
        .where('isNPC', '==', false)
        .limit(100)
        .get()

      const batch = db.batch()

      for (const playerDoc of players.docs) {
        const player = playerDoc.data()
        const roleCategory = player.currentRole?.includes('general') || player.currentRole?.includes('military')
          ? 'military'
          : player.currentRole?.includes('president') || player.currentRole?.includes('minister')
          ? 'political'
          : player.currentRole?.includes('finance') || player.currentRole?.includes('bank')
          ? 'economic'
          : 'default'

        const missions = missionsByRole[roleCategory] || missionsByRole.default

        const missionRef = db.collection('dailyMissions').doc(`${playerDoc.id}_${today}`)
        batch.set(missionRef, {
          playerId: playerDoc.id,
          date: today,
          missions: missions.map(m => ({ ...m, completed: false })),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }

      await batch.commit()
      console.log(`✅ Daily missions generated for ${players.size} players`)

    } catch (e) {
      console.error('Daily missions error:', e)
    }

    return null
  })
