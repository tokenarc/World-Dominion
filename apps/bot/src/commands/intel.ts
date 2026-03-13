import { Context, Markup } from 'telegraf';
import { getPlayer } from '../services/firebaseService';
import { db } from '../lib/firebase-admin';

export const intelCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player || !player.role) {
    return ctx.reply('⚠️ You must have a role to access intelligence reports.');
  }

  // Check if player has Intelligence role
  const allowedRoles = ['intel_chief', 'station_chief', 'agent', 'president', 'prime_minister'];
  if (!allowedRoles.includes(player.role)) {
    return ctx.reply('⚠️ Only Intelligence or high-ranking Political leaders can access intelligence reports.');
  }

  try {
    // Fetch active missions
    const missionsSnapshot = await db.collection('missions')
      .where('nationId', '==', player.nationId)
      .where('status', '==', 'active')
      .get();
    
    const activeMissions = missionsSnapshot.docs.map(doc => doc.data());

    // Fetch intercepted spies
    const spiesSnapshot = await db.collection('intercepted_spies')
      .where('targetNationId', '==', player.nationId)
      .where('status', '==', 'active')
      .get();
    
    const interceptedSpies = spiesSnapshot.docs.map(doc => doc.data());

    let report = `🕵️ *INTELLIGENCE REPORT: ${player.nationId}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    report += `📡 *ACTIVE MISSIONS*\n`;
    if (activeMissions.length === 0) {
      report += `No active missions.\n\n`;
    } else {
      activeMissions.forEach(mission => {
        const remainingTime = Math.max(0, Math.round((mission.endTime - Date.now()) / (1000 * 60)));
        report += `• *${mission.name}* - ${remainingTime}m remaining\n`;
      });
      report += `\n`;
    }

    report += `🕵️ *INTERCEPTED ENEMY SPIES*\n`;
    if (interceptedSpies.length === 0) {
      report += `No intercepted spies.\n\n`;
    } else {
      interceptedSpies.forEach(spy => {
        report += `• *${spy.originNationId}* - Captured at ${new Date(spy.capturedAt).toLocaleTimeString()}\n`;
      });
      report += `\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🕵️ SPY MISSIONS', `${process.env.MINI_APP_URL}/intel/missions`)],
      [Markup.button.webApp('📡 COUNTER-INTEL', `${process.env.MINI_APP_URL}/intel/counter`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in intelCommand:', error);
    await ctx.reply('⚠️ Error fetching intelligence data.');
  }
};
