import { Context, Markup } from 'telegraf';

export const applyCommand = async (ctx: Context) => {
  const MINI_APP_URL = process.env.MINI_APP_URL || 'https://world-dominion.web.app';

  const message = `📝 *ROLE APPLICATION*\n\n`;
  message += `Select a category to apply for a role in the world simulation. Your stats and history will be evaluated by AI Command.\n\n`;
  message += `Categories:`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('⚔️ Military Command', `${MINI_APP_URL}/apply?category=military`)],
    [Markup.button.webApp('🏛️ Political Leadership', `${MINI_APP_URL}/apply?category=political`)],
    [Markup.button.webApp('💰 Economic Command', `${MINI_APP_URL}/apply?category=economic`)],
    [Markup.button.webApp('⛪ Religious & Cultural', `${MINI_APP_URL}/apply?category=religious`)],
    [Markup.button.webApp('🕵️ Intelligence & Ops', `${MINI_APP_URL}/apply?category=intelligence`)]
  ]);

  await ctx.replyWithMarkdown(message, keyboard);
};
