import { db, rtdb } from '../lib/firebase-admin';
import { groq } from '../lib/groq';
import * as fs from 'fs';
import * as path from 'path';
import { Nation, Player, WorldEvent } from './firebaseService';

interface NPCPersonality {
  id: string;
  name: string;
  description: string;
  traits: any;
  groq_system_prompt: string;
}

interface NPCDecision {
  decision: string;
  reasoning: string;
  target: string | null;
}

export const seedAllNPCRoles = async () => {
  const nationsSnapshot = await db.collection('nations').get();
  const rolesPath = path.join(__dirname, '../../../../data/politics/roles_system.json');
  const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
  
  const npcSystemPath = path.join(__dirname, '../../../../data/npc_system.json');
  const npcSystemData = JSON.parse(fs.readFileSync(npcSystemPath, 'utf8'));

  for (const nationDoc of nationsSnapshot.docs) {
    const nation = nationDoc.data() as Nation;
    const nationId = nation.id;

    // Get all roles for this nation
    const allRoles: any[] = [];
    rolesData.role_categories.forEach((cat: any) => {
      cat.roles.forEach((role: any) => {
        // Handle special requirements (simplified for seeding)
        if (role.special?.includes('nuclear') && nation.nuclearWarheads === 0) return;
        if (role.special?.includes('occupation') && nation.occupationLevel === 'none') return;
        if (role.special?.includes('failed') && nation.stability > 0) return;
        
        for (let i = 0; i < (role.maxPerNation || 1); i++) {
          allRoles.push({ ...role, instanceIndex: i });
        }
      });
    });

    for (const role of allRoles) {
      const roleId = role.id;
      const npcId = `${nationId}_${roleId}_${role.instanceIndex}_npc`;
      
      // Check if role is occupied by human
      const humanOccupied = await db.collection('players')
        .where('nationId', '==', nationId)
        .where('role', '==', roleId)
        .get();

      if (humanOccupied.empty) {
        const npcRef = db.collection('players').doc(npcId);
        const npcDoc = await npcRef.get();

        if (!npcDoc.exists) {
          const personality = getNPCPersonality(nationId, nation.ideology, role.npc_personality_default);
          
          const npcPlayer: any = {
            telegramId: npcId,
            username: `NPC_${role.name.replace(/\s+/g, '_')}`,
            firstName: `AI ${role.name}`,
            lastName: nation.name,
            nationId: nationId,
            role: roleId,
            isNPC: true,
            personalityType: personality.id,
            stats: {
              totalScore: 0,
              warBonds: 0,
              commandPoints: npcSystemData.npc_system.npc_salaries[role.id] || npcSystemData.npc_system.npc_salaries.default,
              reputation: 50,
            },
            joinedAt: Date.now(),
            lastActive: Date.now(),
          };

          await npcRef.set(npcPlayer);
          console.log(`Created NPC: ${npcId}`);
        }
      }
    }
  }
};

export const getNPCPersonality = (nationId: string, ideology: string, defaultPersonalityId?: string): NPCPersonality => {
  const npcSystemPath = path.join(__dirname, '../../../../data/npc_system.json');
  const npcSystemData = JSON.parse(fs.readFileSync(npcSystemPath, 'utf8'));
  const personalities = npcSystemData.npc_system.personality_types;

  // Try to find by nationId first (example_nations)
  let personality = personalities.find((p: any) => p.example_nations.includes(nationId));
  
  // If not found, use default or fallback to realist
  if (!personality) {
    personality = personalities.find((p: any) => p.id === defaultPersonalityId) || 
                  personalities.find((p: any) => p.id === 'realist');
  }

  return personality;
};

export const makeNPCDecision = async (nationId: string, role: string, eventContext: WorldEvent): Promise<NPCDecision> => {
  const nationDoc = await db.collection('nations').doc(nationId).get();
  const nation = nationDoc.data() as any;
  
  const npcId = (await db.collection('players')
    .where('nationId', '==', nationId)
    .where('role', '==', role)
    .where('isNPC', '==', true)
    .limit(1)
    .get()).docs[0]?.id;

  if (!npcId) throw new Error('NPC not found');
  const npcDoc = await db.collection('players').doc(npcId).get();
  const npcData = npcDoc.data() as any;
  const personality = getNPCPersonality(nationId, nation.ideology, npcData.personalityType);

  const npcSystemPath = path.join(__dirname, '../../../../data/npc_system.json');
  const npcSystemData = JSON.parse(fs.readFileSync(npcSystemPath, 'utf8'));
  
  // Determine available options based on role category (simplified)
  let options = [];
  if (['supreme_commander', 'general', 'admiral'].includes(role)) options = npcSystemData.npc_system.npc_decision_types.military;
  else if (['president', 'prime_minister', 'foreign_minister'].includes(role)) options = npcSystemData.npc_system.npc_decision_types.diplomatic;
  else if (['finance_minister'].includes(role)) options = npcSystemData.npc_system.npc_decision_types.economic;
  else options = npcSystemData.npc_system.npc_decision_types.domestic;

  const prompt = `You are the ${role} of ${nation.name} in World Dominion, a geopolitical strategy game.
Nation stats: GDP=${nation.gdp}B, Stability=${nation.stability}/100, Military=${nation.militaryStrength}/100,
Ideology=${nation.ideology}, Government=${nation.governmentType}, Alliances=${nation.alliances.join(', ')},
At War With=${nation.atWarWith.join(', ')}, Nuclear=${nation.nuclearWarheads} warheads.
Recent event: ${eventContext.title} — ${eventContext.description}
Your personality: ${personality.description}. ${personality.groq_system_prompt}
Available decisions: ${options.join(', ')}
Return ONLY this JSON (no markdown):
{"decision": "chosen_option", "reasoning": "max 20 words", "target": "ISO_code_or_null"}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-70b-8192',
    response_format: { type: 'json_object' },
  });

  const decision = JSON.parse(completion.choices[0].message.content!) as NPCDecision;

  // Log decision
  await db.collection('npcDecisions').add({
    npcId,
    nationId,
    role,
    ...decision,
    timestamp: Date.now(),
  });

  return decision;
};

export const executeNPCDecision = async (nationId: string, decision: NPCDecision) => {
  console.log(`Executing NPC decision for ${nationId}: ${decision.decision}`);
  // In a real implementation, this would call specific service methods
  // For now, we log and update RTDB
  await rtdb.ref(`live_feed`).push({
    type: 'npc_action',
    nationId,
    text: `${nationId} decision: ${decision.decision}. Reasoning: ${decision.reasoning}`,
    timestamp: Date.now(),
  });
};

export const runNPCCycle = async () => {
  console.log('Starting NPC decision cycle...');
  const nationsSnapshot = await db.collection('nations').get();
  const recentEvents = await db.collection('events').orderBy('timestamp', 'desc').limit(1).get();
  const event = recentEvents.docs[0]?.data() as WorldEvent || { title: 'Global Stability', description: 'The world remains in a state of flux.' };

  for (const nationDoc of nationsSnapshot.docs) {
    const nationId = nationDoc.id;
    const npcs = await db.collection('players')
      .where('nationId', '==', nationId)
      .where('isNPC', '==', true)
      .get();

    for (const npcDoc of npcs.docs) {
      const npc = npcDoc.data();
      try {
        const decision = await makeNPCDecision(nationId, npc.role, event);
        await executeNPCDecision(nationId, decision);
      } catch (error) {
        console.error(`Error in NPC cycle for ${npcDoc.id}:`, error);
      }
    }
  }
  console.log('NPC decision cycle complete.');
};

export const vacateNPCRole = async (nationId: string, roleName: string, humanPlayer: Player) => {
  const npcSnapshot = await db.collection('players')
    .where('nationId', '==', nationId)
    .where('role', '==', roleName)
    .where('isNPC', '==', true)
    .get();

  if (!npcSnapshot.empty) {
    const npcDoc = npcSnapshot.docs[0];
    const npcData = npcDoc.data();

    // Archive NPC
    await db.collection('npcArchive').doc(npcDoc.id).set({
      ...npcData,
      vacatedAt: Date.now(),
      replacedBy: humanPlayer.telegramId,
    });

    // Transfer stats (simplified)
    const updatedStats = {
      ...humanPlayer.stats,
      commandPoints: humanPlayer.stats.commandPoints + npcData.stats.commandPoints,
    };
    await db.collection('players').doc(humanPlayer.telegramId).update({ stats: updatedStats });

    // Remove NPC
    await npcDoc.ref.delete();

    // Farewell message
    const farewell = `AI governance ends. Human leadership begins for ${nationId}. Command transfers to ${humanPlayer.username || humanPlayer.firstName}.`;
    await rtdb.ref(`live_feed`).push({
      type: 'handover',
      nationId,
      text: farewell,
      timestamp: Date.now(),
    });
  }
};
