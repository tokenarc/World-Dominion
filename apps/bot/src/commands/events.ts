import { Context, Markup } from 'telegraf';
import { getRecentEvents } from '../services/firebaseService';

export const eventsCommand = async (ctx: Context) => {
  try {
    const events = await getRecentEvents(10);
    if (events.length === 0) {
      return ctx.reply('⚠️ No recent world events found.');
    }

    let report = `📰 *LATEST WORLD EVENTS*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    events.forEach((event, index) => {
      const timestamp = new Date(event.timestamp).toLocaleString();
      const emoji = {
        war: '⚔️',
        economy: '💰',
        politics: '🏛️',
        natural_disaster: '🌪️'
      }[event.type] || '📅';

      report += `${emoji} *${event.title}*\n`;
      report += `🌍 Nations: *${event.affectedNations.join(', ')}*\n`;
      report += `📝 *${event.description}*\n`;
      report += `🕒 *${timestamp}*\n\n`;
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🌐 FULL NEWS FEED', `${process.env.MINI_APP_URL}/news`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in eventsCommand:', error);
    await ctx.reply('⚠️ Error fetching world events.');
  }
};
