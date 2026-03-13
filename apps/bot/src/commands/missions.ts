import { Context, Markup } from 'telegraf';
import { getPlayer } from '../services/firebaseService';
import { db } from '../lib/firebase-admin';

const getProgressBar = (value: number, max: number = 100, length: number = 10) => {
  const filledCount = Math.round((value / max) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export const missionsCommand = async (ctx: Context) => {
  if (!ctx.from) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player) {
    return ctx.reply('⚠️ Player data not found. Please use /start first.');
  }

  try {
    // Fetch daily missions
    const missionsSnapshot = await db.collection('daily_missions')
      .where('telegramId', '==', player.telegramId)
      .where('status', '==', 'active')
      .get();
    
    const dailyMissions = missionsSnapshot.docs.map(doc => doc.data());

    // Fetch weekly mission
    const weeklyMissionSnapshot = await db.collection('weekly_missions')
      .where('telegramId', '==', player.telegramId)
      .where('status', '==', 'active')
      .get();
    
    const weeklyMission = weeklyMissionSnapshot.docs.map(doc => doc.data())[0];

    let report = `🎖️ *DAILY MISSIONS: ${player.role?.toUpperCase() || 'NO ROLE'}*\n`;
    report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (dailyMissions.length === 0) {
      report += `No active daily missions.\n\n`;
    } else {
      dailyMissions.forEach(mission => {
        const progress = (mission.currentValue / mission.targetValue) * 100;
        report += `• *${mission.name}*\n`;
        report += `${getProgressBar(progress)} *${Math.round(progress)}%*\n`;
        report += `🎁 Reward: *${mission.rewardAmount} ${mission.rewardCurrency}*\n\n`;
      });
    }

    if (weeklyMission) {
      const progress = (weeklyMission.currentValue / weeklyMission.targetValue) * 100;
      report += `📅 *WEEKLY MISSION*\n`;
      report += `• *${weeklyMission.name}*\n`;
      report += `${getProgressBar(progress)} *${Math.round(progress)}%*\n`;
      report += `🎁 Reward: *${weeklyMission.rewardAmount} ${weeklyMission.rewardCurrency}*\n\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🎖️ VIEW ALL MISSIONS', `${process.env.MINI_APP_URL}/missions`)],
      [Markup.button.webApp('🎁 CLAIM REWARDS', `${process.env.MINI_APP_URL}/missions/rewards`)]
    ]);

    await ctx.replyWithMarkdown(report, keyboard);
  } catch (error) {
    console.error('Error in missionsCommand:', error);
    await ctx.reply('⚠️ Error fetching mission data.');
  }
};
