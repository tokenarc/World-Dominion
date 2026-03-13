import { Context, Markup } from 'telegraf';
import { getPlayer } from '../services/firebaseService';

const getStatBar = (value: number, max: number = 100, length: number = 10) => {
  const filledCount = Math.round((value / max) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export const myRoleCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  try {
    const player = await getPlayer(ctx.from.id.toString());
    if (!player) {
      return ctx.reply('⚠️ Player data not found. Please use /start first.');
    }

    if (!player.role) {
      let msg = `👤 *PLAYER PROFILE*\n\n`;
      msg += `You currently hold *NO ROLE* in the world.\n`;
      msg += `Nations are waiting for leaders. Apply for a position to start your journey.\n\n`;
      msg += `Total Score: *${player.stats.totalScore}*\n`;
      msg += `Command Points: *${player.stats.commandPoints}*\n`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📝 Apply for Role', 'apply_role')]
      ]);
      return ctx.replyWithMarkdown(msg, keyboard);
    }

    let profile = `👤 *${player.role.toUpperCase()}* of *${player.nationId}*\n`;
    profile += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    profile += `🏆 Total Score: *${player.stats.totalScore}*\n`;
    profile += `💰 Command Points: *${player.stats.commandPoints}*\n`;
    profile += `🎖️ Reputation: *${player.stats.reputation}*\n\n`;

    profile += `📊 *SKILLS & ATTRIBUTES*\n`;
    const stats = player.stats as any;
    const statLabels: { [key: string]: string } = {
      militaryKnowledge: '⚔️ Military',
      diplomaticSkill: '🤝 Diplomacy',
      leadership: '🏛️ Leadership',
      strategicIq: '🧠 Strategy',
      loyalty: '🫡 Loyalty',
      religiousKnowledge: '⛪ Faith',
      financeSkill: '💵 Finance',
      intelligenceOps: '🕵️ Intel',
      propagandaSkill: '📢 Propaganda'
    };

    Object.entries(statLabels).forEach(([key, label]) => {
      const val = stats[key] || 0;
      profile += `${label}: ${getStatBar(val)} *${val}*\n`;
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('⚙️ MANAGE ROLE', `${process.env.MINI_APP_URL}/role`)]
    ]);

    await ctx.replyWithMarkdown(profile, keyboard);
  } catch (error) {
    console.error('Error in myRoleCommand:', error);
    await ctx.reply('⚠️ Error fetching player profile.');
  }
};
