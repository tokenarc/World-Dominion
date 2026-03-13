import { Context, Markup } from 'telegraf';
import { getLeaderboard, getAllNations } from '../services/firebaseService';

export const leaderboardCommand = async (ctx: Context) => {
  try {
    const players = await getLeaderboard(10);
    const nations = await getAllNations();
    const topNations = nations.slice(0, 5);

    let report = `🏆 *GLOBAL LEADERBOARD*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    report += `👤 *TOP PLAYERS*\n`;
    players.forEach((player, index) => {
      const username = player.username || player.firstName || 'Anonymous';
      const role = player.role ? `(${player.role.toUpperCase()})` : '';
      const nation = player.nationId ? `[${player.nationId}]` : '';
      report += `${index + 1}. *${username}* ${role} ${nation} - *${player.stats.totalScore}*\n`;
    });

    report += `\n🌍 *TOP NATIONS (BY STABILITY)*\n`;
    topNations.forEach((nation, index) => {
      report += `${index + 1}. ${nation.flag} *${nation.name}* [${nation.id}] - *${nation.stability}%*\n`;
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📊 VIEW FULL RANKINGS', `${process.env.MINI_APP_URL}/leaderboard`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in leaderboardCommand:', error);
    await ctx.reply('⚠️ Error fetching leaderboard.');
  }
};
