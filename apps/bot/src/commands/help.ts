import { Context, Markup } from 'telegraf';

export const helpCommand = async (ctx: Context) => {
  const MINI_APP_URL = process.env.MINI_APP_URL || 'https://world-dominion.web.app';

  let helpMessage = `🌍 *WORLD DOMINION HELP*\n`;
  helpMessage += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  helpMessage += `*CORE COMMANDS:*\n`;
  helpMessage += `🚀 /start - Welcome & player stats\n`;
  helpMessage += `📊 /status - Global military & economic report\n`;
  helpMessage += `👤 /myrole - Your current role & skill bars\n`;
  helpMessage += `📝 /apply - Application for a role\n`;
  helpMessage += `🌍 /nation [ISO] - Details for a specific nation\n`;
  helpMessage += `📰 /events - Recent world news & developments\n`;
  helpMessage += `🏆 /leaderboard - Top players & nations\n`;
  helpMessage += `❓ /help - This command list\n\n`;

  helpMessage += `*GAME SECTIONS:*\n`;
  helpMessage += `🗺️ [World Map](${MINI_APP_URL}/map)\n`;
  helpMessage += `⚔️ [Military Command](${MINI_APP_URL}/war)\n`;
  helpMessage += `💰 [Marketplace](${MINI_APP_URL}/market)\n`;
  helpMessage += `🏛️ [National Governance](${MINI_APP_URL}/gov)\n\n`;

  helpMessage += `Need more help? Join our [community channel](https://t.me/WorldDominionGame).`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('🌍 ENTER WORLD DOMINION', MINI_APP_URL)],
    [Markup.button.url('💬 Join Community', 'https://t.me/WorldDominionGame')]
  ]);

  await ctx.replyWithMarkdown(helpMessage, keyboard);
};
