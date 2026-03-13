import { Context, Markup } from 'telegraf';
import { getOrCreatePlayer } from '../services/firebaseService';

export const startCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getOrCreatePlayer(ctx.from);
  const MINI_APP_URL = process.env.MINI_APP_URL || 'https://world-dominion.web.app';

  let message = `🌍 *WELCOME TO WORLD DOMINION*\n\n`;
  
  if (player.role) {
    message += `Greetings, *${player.role.toUpperCase()}* of *${player.nationId}*.\n`;
    message += `Current Score: ${player.stats.totalScore}\n`;
    message += `Command Points: ${player.stats.commandPoints}\n\n`;
  } else {
    message += `The world is in flux. 195 nations await leadership. Will you take command?\n\n`;
  }

  message += `Use the buttons below to enter the simulation or manage your role.`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('🌍 ENTER WORLD DOMINION', MINI_APP_URL)],
    [
      Markup.button.callback('📝 Apply for Role', 'apply_role'),
      Markup.button.callback('📊 World Status', 'world_status')
    ],
    [Markup.button.callback('❓ Help & Commands', 'help')]
  ]);

  await ctx.replyWithMarkdown(message, keyboard);
};
