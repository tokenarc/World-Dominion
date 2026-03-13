import { db } from '../lib/firebase-admin';
import { Player, Nation, saveWorldEvent } from './firebaseService';
import * as fs from 'fs';
import * as path from 'path';

// Load intelligence configurations
const intelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/intelligence/intelligence_agencies.json'), 'utf8'));

export interface SpyMission {
  id: string;
  agentId: string;
  targetNationId: string;
  missionType: string;
  tier: number;
  status: 'running' | 'completed' | 'failed' | 'intercepted';
  successRate: number;
  createdAt: number;
  completesAt: number;
}

/**
 * Launch a spy mission
 */
export const launchMission = async (agentId: string, targetNationId: string, missionType: string) => {
  const agentRef = db.collection('players').doc(agentId);
  const agentDoc = await agentRef.get();
  if (!agentDoc.exists) throw new Error('Agent not found');
  const agent = agentDoc.data() as Player;

  // 1. Check player has Intelligence role
  if (agent.role !== 'intelligence_officer' && agent.role !== 'director_of_intelligence') {
    throw new Error('Only intelligence officers can launch spy missions');
  }

  // 2. Check not already running max missions (e.g., 3)
  const activeMissions = await db.collection('spyMissions')
    .where('agentId', '==', agentId)
    .where('status', '==', 'running')
    .get();
  
  if (activeMissions.size >= 3) {
    throw new Error('Maximum active missions reached (3)');
  }

  // 3. Get mission details from config
  let missionDetails: any = null;
  let tier = 0;
  for (const [tierKey, tierData] of Object.entries(intelConfig.spy_mission_tree)) {
    const m = (tierData as any).missions.find((m: any) => m.id === missionType);
    if (m) {
      missionDetails = m;
      tier = parseInt(tierKey.split('_')[1]);
      break;
    }
  }

  if (!missionDetails) throw new Error('Invalid mission type');

  // 4. Calculate success rate
  const targetRef = db.collection('nations').doc(targetNationId.toUpperCase());
  const targetDoc = await targetRef.get();
  if (!targetDoc.exists) throw new Error('Target nation not found');
  const target = targetDoc.data() as Nation;

  const playerIntelSkill = agent.stats.reputation || 50; // Using reputation as a proxy for skill if not explicitly defined
  const targetCIRating = target.counterIntelRating || 20;
  
  // success_rate = player.intelligenceOps / 100 × (100 - target.counterIntelRating) / 100
  // Using base_success from config as a baseline
  const baseSuccess = missionDetails.base_success || 0.5;
  const skillModifier = playerIntelSkill / 100;
  const ciModifier = (100 - targetCIRating) / 100;
  const successRate = baseSuccess * skillModifier * ciModifier;

  // 5. Set completion time based on mission tier
  const durations: Record<number, number> = { 1: 6, 2: 12, 3: 24, 4: 48 };
  const durationHours = durations[tier] || 6;
  const completesAt = Date.now() + (durationHours * 60 * 60 * 1000);

  // 6. Create mission document
  const missionRef = db.collection('spyMissions').doc();
  const mission: SpyMission = {
    id: missionRef.id,
    agentId,
    targetNationId,
    missionType,
    tier,
    status: 'running',
    successRate,
    createdAt: Date.now(),
    completesAt
  };

  await missionRef.set(mission);

  // Notify player (placeholder)
  console.log(`Mission ${missionType} started against ${targetNationId}. Completes at ${new Date(completesAt).toISOString()}`);

  return mission;
};

/**
 * Resolve a completed mission
 */
export const resolveMission = async (missionId: string) => {
  const missionRef = db.collection('spyMissions').doc(missionId);
  const missionDoc = await missionRef.get();
  if (!missionDoc.exists) return;
  const mission = missionDoc.data() as SpyMission;

  if (mission.status !== 'running') return;

  const roll = Math.random();
  let status: 'completed' | 'failed' | 'intercepted' = 'failed';

  // Check for interception first (Counter-Intelligence)
  const caught = await counterIntelligenceCheck(mission.targetNationId, mission.agentId);
  
  if (caught) {
    status = 'intercepted';
  } else if (roll <= mission.successRate) {
    status = 'completed';
  }

  await missionRef.update({ status });

  if (status === 'completed') {
    await applyMissionEffects(mission);
  } else if (status === 'intercepted') {
    await handleInterceptedAgent(mission);
  }

  // Notify player (placeholder)
  console.log(`Mission ${missionId} resolved as ${status}`);
};

/**
 * Apply effects of a successful mission
 */
const applyMissionEffects = async (mission: SpyMission) => {
  const targetId = mission.targetNationId.toUpperCase();
  const targetRef = db.collection('nations').doc(targetId);
  const targetDoc = await targetRef.get();
  const target = targetDoc.data() as Nation;

  switch (mission.missionType) {
    case 'surveillance':
      // Reveal treasury + stability
      console.log(`Intel: ${targetId} Treasury: ${target.treasury}, Stability: ${target.stability}`);
      break;
    case 'steal_economic_data':
      // Reveal GDP, trade, sanctions
      console.log(`Intel: ${targetId} GDP: ${target.baseGDP}, Sanctions: ${target.sanctionedBy}`);
      break;
    case 'intercept_comms':
      // Reveal 3 recent diplomatic messages (placeholder)
      console.log(`Intel: ${targetId} intercepted 3 messages`);
      break;
    case 'sabotage_infrastructure':
      // target GDP -3% for 7 days
      await targetRef.update({
        industryHealth: db.FieldValue.increment(-10), // Simplified effect
        gdpModifier: -0.03
      });
      break;
    case 'expose_corruption':
      // target stability -8, election triggered
      await targetRef.update({
        stability: db.FieldValue.increment(-8),
        electionTriggered: true
      });
      break;
    case 'assassinate_leader':
      // remove role holder
      await targetRef.update({
        [`roles.${target.leaderRole}`]: null,
        stability: db.FieldValue.increment(-15)
      });
      break;
    case 'coup_support':
      // target stability -15, resistance +20
      await targetRef.update({
        stability: db.FieldValue.increment(-15),
        resistanceMeter: db.FieldValue.increment(20)
      });
      break;
    case 'false_flag':
      // create event blaming different nation
      await saveWorldEvent({
        title: 'Border Incident Reported',
        description: `A violent clash occurred at the border of ${targetId}. Witnesses blame a neighboring state.`,
        timestamp: Date.now(),
        type: 'politics',
        affectedNations: [targetId]
      });
      break;
    case 'plant_sleeper':
      // embedded agent for 30 days
      await db.collection('sleeperAgents').add({
        agentId: mission.agentId,
        targetNationId: targetId,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      break;
  }
};

/**
 * Check if an incoming spy is detected
 */
export const counterIntelligenceCheck = async (nationId: string, spyId: string): Promise<boolean> => {
  const nationRef = db.collection('nations').doc(nationId.toUpperCase());
  const nationDoc = await nationRef.get();
  const nation = nationDoc.data() as Nation;

  const spyRef = db.collection('players').doc(spyId);
  const spyDoc = await spyRef.get();
  const spy = spyDoc.data() as Player;

  const ciRating = nation.counterIntelRating || 20;
  const spySkill = spy.stats.reputation || 50;

  // detection_formula: agency_rating / 100 × (1 - spy_intel_skill / 100)
  const detectionChance = (ciRating / 100) * (1 - (spySkill / 100));
  
  return Math.random() < detectionChance;
};

/**
 * Handle agent being caught
 */
const handleInterceptedAgent = async (mission: SpyMission) => {
  const agentRef = db.collection('players').doc(mission.agentId);
  
  // Burn agent for 7 days
  await agentRef.update({
    isBurned: true,
    burnedUntil: Date.now() + (7 * 24 * 60 * 60 * 1000),
    'stats.reputation': db.FieldValue.increment(-20)
  });

  await saveWorldEvent({
    title: 'Espionage Scandal',
    description: `An agent from a foreign power was apprehended in ${mission.targetNationId} while attempting a ${mission.missionType} mission.`,
    timestamp: Date.now(),
    type: 'politics',
    affectedNations: [mission.targetNationId]
  });
};

/**
 * Setup a double agent
 */
export const doubleAgentSetup = async (agentId: string, nation1: string, nation2: string) => {
  const agentRef = db.collection('players').doc(agentId);
  
  await agentRef.update({
    isDoubleAgent: true,
    primaryNation: nation1,
    secondaryNation: nation2,
    doubleAgentSalary: 1000 // WRB
  });

  console.log(`Agent ${agentId} is now a double agent for ${nation1} and ${nation2}`);
};

/**
 * Launch a cyber attack
 */
export const cyberAttack = async (attackerNationId: string, targetNationId: string) => {
  const targetRef = db.collection('nations').doc(targetNationId.toUpperCase());
  
  // Disrupts target economy
  await targetRef.update({
    gdpModifier: db.FieldValue.increment(-0.02),
    intelAccessDisrupted: true,
    intelDisruptedUntil: Date.now() + (24 * 60 * 60 * 1000)
  });

  await saveWorldEvent({
    title: 'Cyber Attack Detected',
    description: `${targetNationId}'s digital infrastructure has been hit by a massive cyber attack, causing economic disruption.`,
    timestamp: Date.now(),
    type: 'economy',
    affectedNations: [targetNationId]
  });
};
