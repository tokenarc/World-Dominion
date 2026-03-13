import { Context, Markup } from 'telegraf';
import { db, rtdb } from '../lib/firebase-admin';
import { getAllNations, getRecentEvents } from '../services/firebaseService';

const getStatusBar = (value: number, max: number = 100, length: number = 10) => {
  const filledCount = Math.round((value / max) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export const statusCommand = async (ctx: Context) => {
  try {
    const topNations = await getAllNations();
    const top5 = topNations.slice(0, 5);

    // Online players from RTDB presence
    const presenceSnapshot = await rtdb.ref('presence').get();
    let onlineCount = 0;
    if (presenceSnapshot.exists()) {
      const presenceData = presenceSnapshot.val();
      Object.values(presenceData).forEach((nation: any) => {
        Object.values(nation).forEach((player: any) => {
          if (player.online) onlineCount++;
        });
      });
    }

    // Active wars
    const warsSnapshot = await db.collection('wars').where('status', '==', 'active').get();
    const activeWars = warsSnapshot.size;

    // Recent events
    const recentEvents = await getRecentEvents(3);

    let report = `📊 *WORLD STATUS REPORT*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `👥 Online Players: *${onlineCount}*\n`;
    report += `⚔️ Active Conflicts: *${activeWars}*\n\n`;

    report += `🏆 *TOP NATIONS (BY STABILITY)*\n`;
    top5.forEach(nation => {
      report += `${nation.flag} *${nation.name}* [${nation.id}]\n`;
      report += `${getStatusBar(nation.stability)} *${nation.stability}%*\n`;
    });

    report += `\n📰 *LATEST DEVELOPMENTS*\n`;
    recentEvents.forEach(event => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      report += `• [${timestamp}] *${event.title}*\n`;
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🗺️ OPEN WORLD MAP', `${process.env.MINI_APP_URL}/map`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in statusCommand:', error);
    await ctx.reply('⚠️ Error fetching world status. Please try again later.');
  }
};
