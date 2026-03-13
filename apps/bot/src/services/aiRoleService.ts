import { db } from '../lib/firebase-admin';
import { groq } from '../lib/groq';
import * as fs from 'fs';
import * as path from 'path';
import { getPlayer, updatePlayer, Player } from './firebaseService';
import { vacateNPCRole } from './npcService';

interface RoleRequirement {
  ok: boolean;
  failedStat?: string;
  required?: number;
}

interface RoleAvailability {
  available: boolean;
  waitlist?: boolean;
  replacingNPC?: boolean;
}

interface EvaluationResult {
  decision: 'accepted' | 'rejected';
  score: number;
  reason: string;
  alternativeRole?: string;
}

const getRoleData = (roleName: string) => {
  const rolesPath = path.join(__dirname, '../../../../data/politics/roles_system.json');
  const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
  for (const category of rolesData.role_categories) {
    const role = category.roles.find((r: any) => r.id === roleName || r.name === roleName);
    if (role) return role;
  }
  return null;
};

export const checkStatRequirements = (stats: any, roleName: string): RoleRequirement => {
  const role = getRoleData(roleName);
  if (!role || !role.requirements) return { ok: true };

  for (const [stat, min] of Object.entries(role.requirements)) {
    const playerStat = stats[stat] || 0;
    if (playerStat < (min as number)) {
      return { ok: false, failedStat: stat, required: min as number };
    }
  }
  return { ok: true };
};

export const checkRoleAvailability = async (roleName: string, nationId: string): Promise<RoleAvailability> => {
  const role = getRoleData(roleName);
  const roleId = role?.id || roleName;

  const playersSnapshot = await db.collection('players')
    .where('nationId', '==', nationId)
    .where('role', '==', roleId)
    .get();

  if (playersSnapshot.empty) {
    return { available: true };
  }

  const humanPlayer = playersSnapshot.docs.find(doc => !doc.data().isNPC);
  if (humanPlayer) {
    return { available: false, waitlist: true };
  }

  const npcPlayer = playersSnapshot.docs.find(doc => doc.data().isNPC);
  if (npcPlayer) {
    return { available: true, replacingNPC: true };
  }

  return { available: true };
};

export const evaluateWithGroq = async (
  playerData: any,
  roleName: string,
  nationId: string,
  ideology: string,
  statement: string
): Promise<EvaluationResult> => {
  const playersSnapshot = await db.collection('players')
    .where('nationId', '==', nationId)
    .where('role', '==', roleName)
    .limit(1)
    .get();
  
  const currentHolderDoc = playersSnapshot.docs[0];
  const currentHolder = currentHolderDoc ? currentHolderDoc.data().username || currentHolderDoc.data().firstName : 'None';
  const isNPC = currentHolderDoc ? !!currentHolderDoc.data().isNPC : false;

  const prompt = `You are the AI Command of World Dominion game. Evaluate this role application.
Role: ${roleName} | Nation: ${nationId} | Ideology: ${ideology}
Player Stats: totalScore=${playerData.stats.totalScore}, military=${playerData.stats.militaryKnowledge || 0},
diplomacy=${playerData.stats.diplomaticSkill || 0}, leadership=${playerData.stats.leadership || 0}, strategicIq=${playerData.stats.strategicIq || 0},
loyalty=${playerData.stats.loyalty || 0}, religious=${playerData.stats.religiousKnowledge || 0}, finance=${playerData.stats.financeSkill || 0},
intel=${playerData.stats.intelligenceOps || 0}, propaganda=${playerData.stats.propagandaSkill || 0}
Application: "${statement}"
Current holder: ${currentHolder} (NPC=${isNPC})
Return ONLY JSON (no markdown):
{"decision":"accepted","score":75,"reason":"max 30 words","alternativeRole":"only if rejected"}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-70b-8192',
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content!) as EvaluationResult;
};

export const applyForRole = async (
  playerId: string,
  roleName: string,
  nationId: string,
  ideology: string,
  statement: string
) => {
  const player = await getPlayer(playerId);
  if (!player) throw new Error('Player not found');

  // 1. Check Stat Requirements
  const statCheck = checkStatRequirements(player.stats, roleName);
  if (!statCheck.ok) {
    return { success: false, reason: `Insufficient ${statCheck.failedStat}. Required: ${statCheck.required}` };
  }

  // 2. Check Role Availability
  const availability = await checkRoleAvailability(roleName, nationId);
  if (!availability.available) {
    return { success: false, reason: 'Role is already occupied by another human player.', waitlist: true };
  }

  // 3. AI Evaluation
  const evaluation = await evaluateWithGroq(player, roleName, nationId, ideology, statement);

  // 4. Handle Result
  if (evaluation.decision === 'accepted') {
    const role = getRoleData(roleName);
    const roleId = role?.id || roleName;

    // If NPC was there, vacate it
    if (availability.replacingNPC) {
      await vacateNPCRole(nationId, roleId, player);
    }

    // Update player
    await updatePlayer(playerId, {
      nationId,
      role: roleId,
    });

    // Save application
    await db.collection('roleApplications').add({
      playerId,
      roleName: roleId,
      nationId,
      statement,
      evaluation,
      timestamp: Date.now(),
      status: 'accepted'
    });

    return { success: true, evaluation };
  } else {
    // Save failed application
    await db.collection('roleApplications').add({
      playerId,
      roleName,
      nationId,
      statement,
      evaluation,
      timestamp: Date.now(),
      status: 'rejected'
    });

    return { success: false, evaluation };
  }
};

export const updatePlayerStatsFromEvent = async (playerId: string, eventType: string) => {
  const player = await getPlayer(playerId);
  if (!player || !player.role) return;

  const role = getRoleData(player.role);
  if (!role || !role.stat_growth) return;

  const updatedStats = { ...player.stats };
  for (const [stat, delta] of Object.entries(role.stat_growth)) {
    const currentVal = (updatedStats as any)[stat] || 0;
    // Apply delta and cap at 0-100
    (updatedStats as any)[stat] = Math.min(100, Math.max(0, currentVal + (delta as number)));
  }

  await updatePlayer(playerId, { stats: updatedStats });
};
