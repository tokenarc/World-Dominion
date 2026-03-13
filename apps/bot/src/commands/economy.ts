import { Context, Markup } from 'telegraf';
import { getPlayer, getNation } from '../services/firebaseService';

const getStatBar = (value: number, max: number = 100, length: number = 10) => {
  const filledCount = Math.round((value / max) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export const economyCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player || !player.nationId) {
    return ctx.reply('⚠️ You must be part of a nation to view its economic dashboard.');
  }

  try {
    const nation = await getNation(player.nationId);
    if (!nation) {
      return ctx.reply(`⚠️ Nation with ISO code ${player.nationId} not found.`);
    }

    let report = `💰 *ECONOMIC DASHBOARD: ${nation.name.toUpperCase()}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `📊 GDP: *$${(nation.gdp / 1000).toFixed(1)}T*\n`;
    report += `📈 Growth: *${nation.gdpGrowth || 0}%*\n`;
    report += `📉 Inflation: *${nation.inflation || 0}%*\n`;
    report += `🏦 Treasury: *$${(nation.treasury || 0).toLocaleString()}*\n\n`;

    report += `📊 *ECONOMIC HEALTH*\n`;
    report += `Stability: ${getStatBar(nation.stability)} *${nation.stability}%*\n`;
    report += `Infrastructure: ${getStatBar(nation.infrastructure || 50)} *${nation.infrastructure || 50}%*\n`;
    report += `Trade Balance: *${nation.tradeBalance || 0}*\n\n`;

    report += `🚫 *SANCTIONS*\n`;
    report += `Active Sanctions: *${nation.sanctions?.length > 0 ? nation.sanctions.join(', ') : 'None'}*\n\n`;

    const keyboardButtons = [
      [Markup.button.webApp('📈 OPEN MARKETPLACE', `${process.env.MINI_APP_URL}/market`)],
      [Markup.button.webApp('🏦 NATIONAL TREASURY', `${process.env.MINI_APP_URL}/treasury`)]
    ];

    // Show Finance Minister actions if player has that role
    if (player.role === 'finance_minister' || player.role === 'president' || player.role === 'prime_minister') {
      keyboardButtons.push([Markup.button.webApp('⚙️ FINANCE ACTIONS', `${process.env.MINI_APP_URL}/finance-actions`)]);
    }

    const keyboard = Markup.inlineKeyboard(keyboardButtons);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in economyCommand:', error);
    await ctx.reply('⚠️ Error fetching economic data.');
  }
};
