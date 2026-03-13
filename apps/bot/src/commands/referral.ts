import { Context, Markup } from 'telegraf';
import { getPlayer } from '../services/firebaseService';

export const referralCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player) {
    return ctx.reply('⚠️ Player data not found. Please use /start first.');
  }

  try {
    const referralCode = player.telegramId;
    const referralLink = `https://t.me/WorldDominionBot?start=${referralCode}`;
    const referralCount = player.referralCount || 0;
    const cpEarned = player.referralCpEarned || 0;

    let report = `🤝 *REFERRAL PROGRAM*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `Invite your friends to join World Dominion and earn rewards!\n\n`;
    report += `Your Referral Code: *${referralCode}*\n`;
    report += `Referrals Made: *${referralCount}*\n`;
    report += `CP Earned: *${cpEarned.toLocaleString()}*\n\n`;

    report += `🔗 *YOUR REFERRAL LINK:*\n`;
    report += `\`${referralLink}\`\n\n`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📢 SHARE LINK', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me in World Dominion and take command of a nation!')}`)],
      [Markup.button.webApp('🎁 REFERRAL REWARDS', `${process.env.MINI_APP_URL}/referral/rewards`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in referralCommand:', error);
    await ctx.reply('⚠️ Error fetching referral data.');
  }
};
