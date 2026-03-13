import { Context, Markup } from 'telegraf';

export const marketCommand = async (ctx: Context) => {
  const MINI_APP_URL = process.env.MINI_APP_URL || 'https://world-dominion.web.app';

  const message = `🛒 *WORLD MARKETPLACE*\n\nSelect a category to browse the marketplace. Trade resources, weapons, and more with other nations.\n\nCategories:`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('⚔️ Weapons & Military', `${MINI_APP_URL}/market?type=military`)],
    [Markup.button.webApp('💎 Resources & Commodities', `${MINI_APP_URL}/market?type=resources`)],
    [Markup.button.webApp('🏢 Real Estate & Infrastructure', `${MINI_APP_URL}/market?type=real_estate`)],
    [Markup.button.webApp('📈 Stock Exchange', `${MINI_APP_URL}/market?type=stocks`)],
    [Markup.button.webApp('🕵️ Black Market', `${MINI_APP_URL}/market?type=black_market`)]
  ]);

  await ctx.replyWithMarkdown(message, keyboard);
};
