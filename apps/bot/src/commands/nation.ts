import { Context, Markup } from 'telegraf';
import { getNation } from '../services/firebaseService';

const getStatBar = (value: number, max: number = 100, length: number = 10) => {
  const filledCount = Math.round((value / max) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export const nationCommand = async (ctx: Context) => {
  const args = (ctx as any).message?.text?.split(' ') || [];
  if (args.length < 2) {
    return ctx.reply('⚠️ Please provide a nation ISO code. Example: /nation US');
  }

  const isoCode = args[1].toUpperCase();

  try {
    const nation = await getNation(isoCode);
    if (!nation) {
      return ctx.reply(`⚠️ Nation with ISO code *${isoCode}* not found.`, { parse_mode: 'Markdown' });
    }

    let report = `${nation.flag} *${nation.name.toUpperCase()}* [${nation.id}]\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `📊 Stability: ${getStatBar(nation.stability)} *${nation.stability}%*\n`;
    report += `💪 Military: ${getStatBar(nation.militaryStrength)} *${nation.militaryStrength}%*\n`;
    report += `💰 GDP: *$${(nation.gdp / 1000).toFixed(1)}T*\n\n`;

    report += `🏛️ Ideology: *${nation.ideology.replace('_', ' ').toUpperCase()}*\n`;
    report += `🤝 Alliances: *${nation.alliances?.join(', ') || 'None'}*\n`;
    report += `⚔️ At War: *${nation.atWarWith?.length > 0 ? nation.atWarWith.join(', ') : 'None'}*\n\n`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📝 Apply for Role', `${process.env.MINI_APP_URL}/apply?nation=${isoCode}`)],
      [Markup.button.webApp('🗺️ View on Map', `${process.env.MINI_APP_URL}/map?nation=${isoCode}`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in nationCommand:', error);
    await ctx.reply('⚠️ Error fetching nation data.');
  }
};
