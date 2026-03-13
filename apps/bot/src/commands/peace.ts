import { Context, Markup } from 'telegraf';
import { getPlayer, getNation } from '../services/firebaseService';
import { db } from '../lib/firebase-admin';

export const peaceCommand = async (ctx: Context) => {
  if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player || !player.role) {
    return ctx.reply('⚠️ You must have a leadership role to propose peace.');
  }

  // Check if player has President/General role
  const allowedRoles = ['supreme_commander', 'general', 'president', 'prime_minister', 'foreign_minister'];
  if (!allowedRoles.includes(player.role)) {
    return ctx.reply('⚠️ Only high-ranking Military or Political leaders can propose peace.');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Please specify a target nation ISO code. Example: /peace RU');
  }

  const targetIso = args[1].toUpperCase();
  if (targetIso === player.nationId) {
    return ctx.reply('⚠️ You cannot propose peace to your own nation.');
  }

  try {
    const targetNation = await getNation(targetIso);
    if (!targetNation) {
      return ctx.reply(`⚠️ Nation with ISO code ${targetIso} not found.`);
    }

    // Check if at war
    const attackerRef = db.collection('nations').doc(player.nationId!);
    const attackerDoc = await attackerRef.get();
    const attackerData = attackerDoc.data();
    
    if (!attackerData || !attackerData.atWarWith || !attackerData.atWarWith.includes(targetIso)) {
      return ctx.reply(`⚠️ You are not currently at war with ${targetIso}.`);
    }

    const message = `🤝 *PEACE PROPOSAL*\n\nAre you sure you want to send a peace proposal to *${targetNation.name}* (${targetIso})?\n\nThis will notify their leaders and allow them to accept or reject the proposal.`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🕊️ SEND PROPOSAL', `send_peace:${targetIso}`),
        Markup.button.callback('❌ CANCEL', 'cancel_peace')
      ]
    ]);

    await ctx.replyWithMarkdown(message, keyboard);
  } catch (error) {
    console.error('Error in peaceCommand:', error);
    await ctx.reply('⚠️ Error processing peace proposal.');
  }
};

export const handlePeaceAction = async (ctx: Context) => {
  const query = ctx.callbackQuery;
  if (!query || !('data' in query)) return;

  const data = query.data;
  if (data === 'cancel_peace') {
    await ctx.editMessageText('❌ Peace proposal cancelled.');
    return;
  }

  if (data.startsWith('send_peace:')) {
    const targetIso = data.split(':')[1];
    const player = await getPlayer(ctx.from!.id.toString());
    
    if (!player) return;

    try {
      // In a real implementation, we would send a notification to the target nation's leaders
      // For now, we'll simulate the process and notify the user
      
      await ctx.editMessageText(`🕊️ *PEACE PROPOSAL SENT!* \n\nA peace proposal has been sent to the leaders of ${targetIso}. Waiting for their response.`);
      
      // Notify target leaders (In a real app, this would use a notification service)
      console.log(`Notifying leaders in ${targetIso} about the peace proposal from ${player.nationId}.`);
      
    } catch (error) {
      console.error('Error sending peace proposal:', error);
      await ctx.reply('⚠️ Failed to send peace proposal. Please try again.');
    }
  }
};
