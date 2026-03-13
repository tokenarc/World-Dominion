import { db, rtdb } from '../lib/firebase-admin'
import * as admin from 'firebase-admin'
import { getNation, saveWorldEvent } from './firebaseService'

export interface War {
  id: string
  aggressor: string
  defender: string
  aggressorName: string
  defenderName: string
  status: 'active' | 'ended' | 'ceasefire'
  warScore: number
  currentRound: number
  startedAt: number
  endedAt?: number
  winner?: string
  casualties: {
    aggressor: number
    defender: number
  }
}

export const declareWar = async (
  aggressorId: string,
  defenderId: string,
  declaredByPlayerId: string
): Promise<{ success: boolean; message: string; war?: War }> => {
  try {
    // Check both nations exist
    const [aggressor, defender] = await Promise.all([
      getNation(aggressorId),
      getNation(defenderId)
    ])

    if (!aggressor) return { success: false, message: 'Your nation not found' }
    if (!defender) return { success: false, message: `Nation ${defenderId} not found` }

    // Check not already at war
    const existingWar = await db.collection('wars')
      .where('aggressor', '==', aggressorId)
      .where('defender', '==', defenderId)
      .where('status', '==', 'active')
      .get()

    if (!existingWar.empty) {
      return { success: false, message: `Already at war with ${defender.name}` }
    }

    // Check cooldown (48hr after last war)
    const recentWar = await db.collection('wars')
      .where('aggressor', '==', aggressorId)
      .where('status', '==', 'ended')
      .orderBy('endedAt', 'desc')
      .limit(1)
      .get()

    if (!recentWar.empty) {
      const lastWar = recentWar.docs[0].data()
      const hoursSince = (Date.now() - lastWar.endedAt) / (1000 * 60 * 60)
      if (hoursSince < 48) {
        return { success: false, message: `War cooldown active. ${Math.ceil(48 - hoursSince)} hours remaining.` }
      }
    }

    // Create war
    const warRef = db.collection('wars').doc()
    const war: War = {
      id: warRef.id,
      aggressor: aggressorId,
      defender: defenderId,
      aggressorName: aggressor.name,
      defenderName: defender.name,
      status: 'active',
      warScore: 0,
      currentRound: 0,
      startedAt: Date.now(),
      casualties: { aggressor: 0, defender: 0 }
    }

    await warRef.set(war)

    // Update nations atWarWith
    await db.collection('nations').doc(aggressorId).update({
      atWarWith: admin.firestore.FieldValue.arrayUnion(defenderId)
    })
    await db.collection('nations').doc(defenderId).update({
      atWarWith: admin.firestore.FieldValue.arrayUnion(aggressorId)
    })

    // Save world event
    await saveWorldEvent({
      title: `${aggressor.flag || ''} ${aggressor.name} declares war on ${defender.flag || ''} ${defender.name}`,
      description: `War has been declared. Battle rounds every 6 hours. War score: 0/100`,
      type: 'war',
      affectedNations: [aggressorId, defenderId],
      timestamp: Date.now(),
      fromNews: false,
      expiresAt: null
    })

    // Update RTDB
    await rtdb.ref(`activeBattles/${warRef.id}`).set({
      ...war,
      lastUpdated: Date.now()
    })

    return { success: true, message: `War declared against ${defender.name}!`, war }
  } catch (error) {
    console.error('Declare war error:', error)
    return { success: false, message: 'Failed to declare war' }
  }
}

export const proposePeace = async (
  initiatorNationId: string,
  targetNationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const activeWar = await db.collection('wars')
      .where('status', '==', 'active')
      .get()

    const war = activeWar.docs.find(d => {
      const data = d.data()
      return (data.aggressor === initiatorNationId && data.defender === targetNationId) ||
             (data.aggressor === targetNationId && data.defender === initiatorNationId)
    })

    if (!war) {
      return { success: false, message: 'No active war found between these nations' }
    }

    await war.ref.update({
      peaceProposedBy: initiatorNationId,
      peaceProposedAt: Date.now()
    })

    return { success: true, message: 'Peace proposal sent. Awaiting response.' }
  } catch (error) {
    console.error('Peace proposal error:', error)
    return { success: false, message: 'Failed to send peace proposal' }
  }
}

export const acceptPeace = async (
  warId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const warDoc = await db.collection('wars').doc(warId).get()
    if (!warDoc.exists) return { success: false, message: 'War not found' }

    const war = warDoc.data() as War

    await warDoc.ref.update({
      status: 'ended',
      endedAt: Date.now(),
      winner: null
    })

    await db.collection('nations').doc(war.aggressor).update({
      atWarWith: admin.firestore.FieldValue.arrayRemove(war.defender)
    })
    await db.collection('nations').doc(war.defender).update({
      atWarWith: admin.firestore.FieldValue.arrayRemove(war.aggressor)
    })

    await saveWorldEvent({
      title: `Peace treaty signed: ${war.aggressorName} and ${war.defenderName}`,
      description: 'The warring nations have agreed to a ceasefire.',
      type: 'politics',
      affectedNations: [war.aggressor, war.defender],
      timestamp: Date.now(),
      fromNews: false,
      expiresAt: null
    })

    return { success: true, message: 'Peace accepted. War ended.' }
  } catch (error) {
    console.error('Accept peace error:', error)
    return { success: false, message: 'Failed to accept peace' }
  }
}

export const getActiveWars = async (): Promise<War[]> => {
  const snapshot = await db.collection('wars')
    .where('status', '==', 'active')
    .get()
  return snapshot.docs.map(d => d.data() as War)
}

export const getNationWars = async (nationId: string): Promise<War[]> => {
  const [asAggressor, asDefender] = await Promise.all([
    db.collection('wars').where('aggressor', '==', nationId).where('status', '==', 'active').get(),
    db.collection('wars').where('defender', '==', nationId).where('status', '==', 'active').get()
  ])
  return [
    ...asAggressor.docs.map(d => d.data() as War),
    ...asDefender.docs.map(d => d.data() as War)
  ]
}
