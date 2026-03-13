import { Context, Markup } from 'telegraf';
import { getPlayer } from '../services/firebaseService';
import { db } from '../lib/firebase-admin';

export const walletCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player) {
    return ctx.reply('⚠️ Player data not found. Please use /start first.');
  }

  try {
    // Fetch transaction history
    const transactionsSnapshot = await db.collection('transactions')
      .where('telegramId', '==', player.telegramId)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());

    let report = `💳 *WALLET DASHBOARD*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `💰 War Bonds (WRB): *${player.stats.warBonds.toLocaleString()}*\n`;
    report += `🎖️ Command Points (CP): *${player.stats.commandPoints.toLocaleString()}*\n\n`;

    report += `📜 *RECENT TRANSACTIONS*\n`;
    if (transactions.length === 0) {
      report += `No recent transactions.\n\n`;
    } else {
      transactions.forEach(tx => {
        const type = tx.type === 'buy' ? '🟢' : '🔴';
        const amount = tx.amount.toLocaleString();
        const currency = tx.currency === 'wrb' ? 'WRB' : 'CP';
        report += `${type} *${amount} ${currency}* - ${tx.description}\n`;
      });
      report += `\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.webApp('💰 BUY WRB', `${process.env.MINI_APP_URL}/wallet/buy`),
        Markup.button.webApp('💸 SELL WRB', `${process.env.MINI_APP_URL}/wallet/sell`)
      ],
      [Markup.button.webApp('📜 FULL HISTORY', `${process.env.MINI_APP_URL}/wallet/history`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in walletCommand:', error);
    await ctx.reply('⚠️ Error fetching wallet data.');
  }
};
