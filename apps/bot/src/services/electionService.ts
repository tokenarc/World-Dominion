import { db, rtdb } from '../lib/firebase-admin';
import { Nation, Player, WorldEvent, Election } from '../../../../data/types';
import * as fs from 'fs';
import * as path from 'path';
import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { vacateNPCRole } from './npcService';
import { saveWorldEvent, getAllNations, getNation, getPlayer, updatePlayer } from './firebaseService';

dotenv.config();

const electionSystemPath = path.join(__dirname, '../../../../data/politics/election_system.json');
const electionSystem = JSON.parse(fs.readFileSync(electionSystemPath, 'utf8'));

const bot = new Telegraf(process.env.BOT_TOKEN || '');

/**
 * Schedules an election for a given nation.
 * @param nationId The ID of the nation for which to schedule an election.
 */
export const scheduleElection = async (nationId: string) => {
  const nation = await getNation(nationId);
  if (!nation) {
    console.error(`Nation ${nationId} not found.`);
    return;
  }

  if (!electionSystem.eligible_governments.includes(nation.governmentType)) {
    console.log(`Nation ${nationId} (${nation.governmentType}) is not eligible for elections.`);
    return;
  }

  const now = Date.now();
  const votingWindowHours = electionSystem.voting_duration_hours;
  const endsAt = now + votingWindowHours * 60 * 60 * 1000;

  // Find eligible candidates (players with roles in the nation, not NPCs)
  const playersInNation = await db.collection('players')
    .where('currentNation', '==', nationId)
    .where('isNPC', '==', false)
    .get();

  const candidates: string[] = playersInNation.docs.map(doc => doc.id);

  if (candidates.length === 0) {
    console.log(`No eligible players to run for election in ${nationId}.`);
    return;
  }

  const electionRef = db.collection('elections').doc();
  const newElection: Election = {
    nationId,
    candidates,
    votes: {}, // Initialize with empty votes
    status: 'active',
    startedAt: now,
    endsAt,
    winnerId: null,
    isCoupAttempted: false,
  };

  await electionRef.set(newElection);

  // Notify all players in the nation and post to nation Telegram channel
  const message = `🗳️ *ELECTION ALERT!* 🗳️\n\nAn election has been scheduled for *${nation.name}*!\nCandidates: ${candidates.map(c => `@${c}`).join(', ')}\nVoting ends: ${new Date(endsAt).toLocaleString()}\n\nCast your vote now!`;

  if (nation.telegramChannelId) {
    try {
      await bot.telegram.sendMessage(nation.telegramChannelId, message, { parse_mode: 'Markdown' });
      console.log(`Election announcement posted to ${nation.telegramChannelId}`);
    } catch (error) {
      console.error(`Error posting election announcement to ${nation.telegramChannelId}:`, error);
    }
  }

  for (const playerDoc of playersInNation.docs) {
    const player = playerDoc.data() as Player;
    if (player.telegramId) {
      try {
        await bot.telegram.sendMessage(player.telegramId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Error notifying player ${player.telegramId} about election:`, error);
      }
    }
  }

  console.log(`Election scheduled for ${nationId}. Election ID: ${electionRef.id}`);
};

/**
 * Allows a player to cast a vote in an election.
 * @param voterId The Telegram ID of the player casting the vote.
 * @param electionId The ID of the election.
 * @param candidateId The ID of the candidate being voted for.
 */
export const castVote = async (voterId: string, electionId: string, candidateId: string) => {
  const electionRef = db.collection('elections').doc(electionId);
  const electionDoc = await electionRef.get();

  if (!electionDoc.exists) {
    console.error(`Election ${electionId} not found.`);
    return { success: false, message: 'Election not found.' };
  }

  const election = electionDoc.data() as Election;

  if (election.status !== 'active' || Date.now() > election.endsAt) {
    return { success: false, message: 'Voting is closed for this election.' };
  }

  const player = await getPlayer(voterId);
  if (!player || player.currentNation !== election.nationId) {
    return { success: false, message: 'You are not an eligible voter for this nation.' };
  }

  if (!election.candidates.includes(candidateId)) {
    return { success: false, message: 'Invalid candidate.' };
  }

  // Check if player has already voted
  const existingVote = await db.collection('votes')
    .where('electionId', '==', electionId)
    .where('voterId', '==', voterId)
    .limit(1)
    .get();

  if (!existingVote.empty) {
    return { success: false, message: 'You have already voted in this election.' };
  }

  // Record the vote
  await db.collection('votes').add({
    electionId,
    voterId,
    candidateId,
    timestamp: Date.now(),
  });

  // Update votes tally in Firestore real-time (denormalized for easy access)
  const votesUpdate: { [key: string]: any } = {};
  votesUpdate[`votes.${candidateId}`] = (election.votes[candidateId] || 0) + 1;
  await electionRef.update(votesUpdate);

  return { success: true, message: `Your vote for ${candidateId} has been cast!` };
};

/**
 * Closes an election, declares a winner, and updates roles.
 * @param electionId The ID of the election to close.
 */
export const closeElection = async (electionId: string) => {
  const electionRef = db.collection('elections').doc(electionId);
  const electionDoc = await electionRef.get();

  if (!electionDoc.exists) {
    console.error(`Election ${electionId} not found.`);
    return;
  }

  const election = electionDoc.data() as Election;

  if (election.status !== 'active') {
    console.log(`Election ${electionId} is not active.`);
    return;
  }

  // Count votes
  const voteCounts: { [key: string]: number } = {};
  for (const candidateId of election.candidates) {
    voteCounts[candidateId] = election.votes[candidateId] || 0;
  }

  let winnerId: string | null = null;
  let maxVotes = -1;

  for (const candidateId in voteCounts) {
    if (voteCounts[candidateId] > maxVotes) {
      maxVotes = voteCounts[candidateId];
      winnerId = candidateId;
    } else if (voteCounts[candidateId] === maxVotes) {
      // Tie-breaking: current leader stays, or random if no current leader
      // For simplicity, let's just pick the first one in case of a tie for now
      // A more complex tie-breaking rule can be implemented later
    }
  }

  if (!winnerId) {
    console.log(`No winner declared for election ${electionId}.`);
    await electionRef.update({ status: 'completed' });
    return;
  }

  // Update winner's role to President/PM
  const winnerPlayer = await getPlayer(winnerId);
  const nation = await getNation(election.nationId);

  if (winnerPlayer && nation) {
    const electedRole = electionSystem.roles_elected[0]; // Assuming first role in list is the presidential/PM role
    const currentLeaderSnapshot = await db.collection('players')
      .where('currentNation', '==', nation.id)
      .where('currentRole', '==', electedRole)
      .limit(1)
      .get();

    if (!currentLeaderSnapshot.empty) {
      const currentLeader = currentLeaderSnapshot.docs[0].data() as Player;
      if (currentLeader.telegramId !== winnerId) {
        // Vacate NPC if winner replaced AI
        if (currentLeader.isNPC) {
          await vacateNPCRole(nation.id, electedRole, winnerPlayer);
        } else {
          // If human leader is replaced, set their role to null
          await updatePlayer(currentLeader.telegramId, { currentRole: null });
        }
      }
    }
    await updatePlayer(winnerId, { currentRole: electedRole });
    console.log(`Winner ${winnerId} is now ${electedRole} of ${nation.name}.`);
  }

  await electionRef.update({
    status: 'completed',
    winnerId,
  });

  // Post results to nation channel
  const resultsMessage = `🎉 *ELECTION RESULTS ARE IN!* 🎉\n\nAfter a fierce campaign, *${winnerPlayer?.username || winnerId}* has been elected as the new ${electionSystem.roles_elected[0]} of *${nation?.name}*!\n\nCongratulations to the winner!`;

  if (nation?.telegramChannelId) {
    try {
      await bot.telegram.sendMessage(nation.telegramChannelId, resultsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(`Error posting election results to ${nation.telegramChannelId}:`, error);
    }
  }

  // Loser gets CONCEDE or ATTEMPT COUP choice (this would be an interactive message)
  // For now, we'll just log this.
  console.log(`Election ${electionId} closed. Winner: ${winnerId}. Losers can now choose to concede or attempt a coup.`);
};

/**
 * Allows a player to initiate a coup in a target nation.
 * @param playerId The ID of the player initiating the coup.
 * @param targetNationId The ID of the nation where the coup is attempted.
 */
export const initiateCoup = async (playerId: string, targetNationId: string) => {
  const player = await getPlayer(playerId);
  const targetNation = await getNation(targetNationId);

  if (!player) {
    return { success: false, message: 'Player not found.' };
  }
  if (!targetNation) {
    return { success: false, message: 'Target nation not found.' };
  }

  // Check if player has military role and enough WRB
  const requiredRole = 'general'; // Example military role
  const requiredWRB = 3000;

  if (player.currentRole !== requiredRole) {
    return { success: false, message: `You must be a ${requiredRole} to initiate a coup.` };
  }
  if (player.wallet.warBonds < requiredWRB) {
    return { success: false, message: `You need ${requiredWRB} WarBonds to initiate a coup.` };
  }

  // Calculate success chance
  // Formula: player.militaryKnowledge × nation.instability / 100
  const instability = 100 - targetNation.stability; // Assuming instability is inverse of stability
  const successChance = (player.stats.militaryKnowledge * instability) / 100;
  const success = Math.random() * 100 < successChance;

  let message = '';
  let worldEventTitle = '';
  let worldEventDescription = '';
  let stabilityChange = 0;

  if (success) {
    // Forcibly replace leader, stability -25
    const electedRole = electionSystem.roles_elected[0];
    const currentLeaderSnapshot = await db.collection('players')
      .where('currentNation', '==', targetNation.id)
      .where('currentRole', '==', electedRole)
      .limit(1)
      .get();

    if (!currentLeaderSnapshot.empty) {
      const currentLeader = currentLeaderSnapshot.docs[0].data() as Player;
      await updatePlayer(currentLeader.telegramId, { currentRole: null });
      console.log(`Leader ${currentLeader.telegramId} of ${targetNation.name} replaced by coup.`);
    }
    await updatePlayer(playerId, { currentRole: electedRole, currentNation: targetNation.id });
    stabilityChange = -25;
    message = `💥 *COUP SUCCESSFUL!* 💥\n\nPlayer *${player.username || playerId}* has successfully overthrown the government of *${targetNation.name}*! The nation is in chaos.`;
    worldEventTitle = `Coup in ${targetNation.name}`; 
    worldEventDescription = `A military coup led by ${player.username || playerId} has seized power in ${targetNation.name}.`;
  } else {
    // Player arrested, role suspended 7 days
    // For simplicity, we'll just log and reduce reputation for now.
    // A full suspension mechanism would involve more complex state management.
    await updatePlayer(playerId, { reputation: player.reputation - 40 });
    message = `🚨 *COUP FAILED!* 🚨\n\nPlayer *${player.username || playerId}*'s coup attempt in *${targetNation.name}* has failed! They have been arrested and face severe consequences.`;
    worldEventTitle = `Coup Attempt Fails in ${targetNation.name}`; 
    worldEventDescription = `A coup attempt led by ${player.username || playerId} in ${targetNation.name} has been thwarted.`;
  }

  // Update nation stability
  const newStability = Math.max(0, Math.min(100, targetNation.stability + stabilityChange));
  await db.collection('nations').doc(targetNationId).update({ stability: newStability });
  await rtdb.ref(`nations/${targetNationId}`).update({ stability: newStability });

  // Post dramatic event to world feed
  await saveWorldEvent({
    type: 'revolution',
    title: worldEventTitle,
    description: worldEventDescription,
    affectedNations: [targetNationId],
    effects: { stability_change: stabilityChange },
    fromNews: false,
    timestamp: Date.now(),
    createdAt: Date.now(),
    expiresAt: null,
  });

  // Notify all players in the target nation and world feed
  const allPlayers = await db.collection('players').get();
  for (const playerDoc of allPlayers.docs) {
    const p = playerDoc.data() as Player;
    if (p.telegramId) {
      try {
        await bot.telegram.sendMessage(p.telegramId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Error notifying player ${p.telegramId} about coup:`, error);
      }
    }
  }

  return { success, message };
};

/**
 * Allows the President/PM to declare a national emergency.
 * @param presidentialId The ID of the player holding the presidential role.
 */
export const declareEmergency = async (presidentialId: string) => {
  const player = await getPlayer(presidentialId);
  if (!player || !player.currentNation) {
    return { success: false, message: 'Player not found or not assigned to a nation.' };
  }

  const nation = await getNation(player.currentNation);
  if (!nation) {
    return { success: false, message: 'Nation not found.' };
  }

  const electedRole = electionSystem.roles_elected[0];
  if (player.currentRole !== electedRole) {
    return { success: false, message: `Only the ${electedRole} can declare a national emergency.` };
  }

  // Suspend elections for 30 days
  const emergencyEndsAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
  await db.collection('nations').doc(nation.id).update({
    emergencyDeclared: true,
    emergencyEndsAt,
  });

  // Stability +5 short term
  const newStability = Math.min(100, nation.stability + 5);
  await db.collection('nations').doc(nation.id).update({ stability: newStability });
  await rtdb.ref(`nations/${nation.id}`).update({ stability: newStability });

  // International pressure event (placeholder for now, could be a WorldEvent)
  await saveWorldEvent({
    type: 'political',
    title: `Emergency Declared in ${nation.name}`,
    description: `${player.username || presidentialId} has declared a national emergency in ${nation.name}, suspending democratic processes.`, 
    affectedNations: [nation.id],
    effects: { stability_change: 5 },
    fromNews: false,
    timestamp: Date.now(),
    createdAt: Date.now(),
    expiresAt: emergencyEndsAt,
  });

  const message = `🚨 *NATIONAL EMERGENCY DECLARED!* 🚨\n\n${player.username || presidentialId} has declared a national emergency in *${nation.name}*! Elections are suspended for 30 days, and stability has temporarily increased.`;

  if (nation.telegramChannelId) {
    try {
      await bot.telegram.sendMessage(nation.telegramChannelId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(`Error posting emergency declaration to ${nation.telegramChannelId}:`, error);
    }
  }

  console.log(`Emergency declared in ${nation.id}. Elections suspended until ${new Date(emergencyEndsAt).toLocaleString()}.`);
  return { success: true, message: 'National emergency declared.' };
};

/**
 * Checks election schedules for all democratic nations and schedules new elections if due.
 * Called daily by Cloud Function.
 */
export const checkElectionSchedule = async () => {
  console.log('Checking election schedules...');
  const allNations = await getAllNations();
  const now = Date.now();

  for (const nation of allNations) {
    if (electionSystem.eligible_governments.includes(nation.governmentType)) {
      // Check if an emergency is active
      if (nation.emergencyDeclared && nation.emergencyEndsAt && now < nation.emergencyEndsAt) {
        console.log(`Elections suspended in ${nation.name} due to national emergency.`);
        continue;
      }

      const lastElectionSnapshot = await db.collection('elections')
        .where('nationId', '==', nation.id)
        .orderBy('endsAt', 'desc')
        .limit(1)
        .get();

      let lastElectionTime = 0;
      if (!lastElectionSnapshot.empty) {
        lastElectionTime = (lastElectionSnapshot.docs[0].data() as Election).endsAt;
      }

      const electionCycleDays = electionSystem.election_cycle_days;
      const electionDueTime = lastElectionTime + electionCycleDays * 24 * 60 * 60 * 1000;

      if (now > electionDueTime) {
        console.log(`Election due for ${nation.name}. Scheduling now...`);
        await scheduleElection(nation.id);
      } else {
        console.log(`Election for ${nation.name} not yet due. Next election in approximately ${Math.ceil((electionDueTime - now) / (24 * 60 * 60 * 1000))} days.`);
      }
    }
  }
  console.log('Election schedule check complete.');
};
