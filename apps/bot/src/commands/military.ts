import { Context, Markup } from 'telegraf';
import { getPlayer, getNation } from '../services/firebaseService';

const getStatBar = (value: number, max: number = 100, length: number = 10) => {
  const filledCount = Math.round((value / max) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export const militaryCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player || !player.nationId) {
    return ctx.reply('⚠️ You must be part of a nation to view its military status.');
  }

  try {
    const nation = await getNation(player.nationId);
    if (!nation) {
      return ctx.reply(`⚠️ Nation with ISO code ${player.nationId} not found.`);
    }

    let report = `⚔️ *MILITARY STATUS: ${nation.name.toUpperCase()}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `💪 Strength: ${getStatBar(nation.militaryStrength)} *${nation.militaryStrength}%*\n`;
    report += `🛡️ Defense: ${getStatBar(nation.defenseRating || 50)} *${nation.defenseRating || 50}%*\n`;
    report += `🎖️ Morale: ${getStatBar(nation.morale || 50)} *${nation.morale || 50}%*\n\n`;

    report += `🌍 *TERRITORY*\n`;
    report += `Territory Count: *${nation.territoryCount || 1}*\n`;
    report += `Occupied Nations: *${nation.occupiedNations?.length > 0 ? nation.occupiedNations.join(', ') : 'None'}*\n\n`;

    report += `⚔️ *ACTIVE WARS*\n`;
    report += `At War With: *${nation.atWarWith?.length > 0 ? nation.atWarWith.join(', ') : 'None'}*\n\n`;

    const keyboardButtons = [
      [Markup.button.webApp('🗺️ OPEN WORLD MAP', `${process.env.MINI_APP_URL}/map`)],
      [Markup.button.webApp('⚔️ MILITARY COMMAND', `${process.env.MINI_APP_URL}/war`)]
    ];

    // Show General actions if player has that role
    if (player.role === 'supreme_commander' || player.role === 'general' || player.role === 'president' || player.role === 'prime_minister') {
      keyboardButtons.push([Markup.button.webApp('⚙️ MILITARY ACTIONS', `${process.env.MINI_APP_URL}/military-actions`)]);
    }

    const keyboard = Markup.inlineKeyboard(keyboardButtons);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in militaryCommand:', error);
    await ctx.reply('⚠️ Error fetching military data.');
  }
};
