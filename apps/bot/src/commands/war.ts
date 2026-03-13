import { Context, Markup } from 'telegraf';
import { getPlayer, getNation } from '../services/firebaseService';
import { db } from '../lib/firebase-admin';

export const warCommand = async (ctx: Context) => {
  if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

  const player = await getPlayer(ctx.from.id.toString());
  if (!player || !player.role) {
    return ctx.reply('⚠️ You must have a leadership role to declare war.');
  }

  // Check if player has General+ role (Supreme Commander or General)
  const allowedRoles = ['supreme_commander', 'general', 'president', 'prime_minister'];
  if (!allowedRoles.includes(player.role)) {
    return ctx.reply('⚠️ Only high-ranking Military or Political leaders can declare war.');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('⚠️ Please specify a target nation ISO code. Example: /war RU');
  }

  const targetIso = args[1].toUpperCase();
  if (targetIso === player.nationId) {
    return ctx.reply('⚠️ You cannot declare war on your own nation.');
  }

  try {
    const targetNation = await getNation(targetIso);
    if (!targetNation) {
      return ctx.reply(`⚠️ Nation with ISO code ${targetIso} not found.`);
    }

    const message = `⚔️ *WAR DECLARATION*\n\nAre you sure you want to declare war on *${targetNation.name}* (${targetIso})?\n\nThis will trigger immediate battle rounds and notify all players in both nations.`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔥 CONFIRM WAR', `confirm_war:${targetIso}`),
        Markup.button.callback('❌ CANCEL', 'cancel_war')
      ]
    ]);

    await ctx.replyWithMarkdown(message, keyboard);
  } catch (error) {
    console.error('Error in warCommand:', error);
    await ctx.reply('⚠️ Error processing war declaration.');
  }
};

export const handleWarAction = async (ctx: Context) => {
  const query = ctx.callbackQuery;
  if (!query || !('data' in query)) return;

  const data = query.data;
  if (data === 'cancel_war') {
    await ctx.editMessageText('❌ War declaration cancelled.');
    return;
  }

  if (data.startsWith('confirm_war:')) {
    const targetIso = data.split(':')[1];
    const player = await getPlayer(ctx.from!.id.toString());
    
    if (!player) return;

    try {
      // In a real implementation, we would call warService.declareWar()
      // For now, we'll simulate the process and update Firestore
      
      const warRef = db.collection('wars').doc();
      const warData = {
        id: warRef.id,
        attacker: player.nationId,
        defender: targetIso,
        status: 'active',
        startedAt: Date.now(),
        rounds: [],
        currentRound: 1
      };
      
      await warRef.set(warData);
      
      // Update nations' atWarWith status
      const attackerRef = db.collection('nations').doc(player.nationId!);
      const defenderRef = db.collection('nations').doc(targetIso);
      
      await db.runTransaction(async (transaction) => {
        const attackerDoc = await transaction.get(attackerRef);
        const defenderDoc = await transaction.get(defenderRef);
        
        if (attackerDoc.exists && defenderDoc.exists) {
          const attackerData = attackerDoc.data()!;
          const defenderData = defenderDoc.data()!;
          
          transaction.update(attackerRef, {
            atWarWith: [...(attackerData.atWarWith || []), targetIso]
          });
          
          transaction.update(defenderRef, {
            atWarWith: [...(defenderData.atWarWith || []), player.nationId]
          });
        }
      });

      await ctx.editMessageText(`🔥 *WAR DECLARED!* \n\n${player.nationId} is now at war with ${targetIso}. All forces mobilized.`);
      
      // Notify players (In a real app, this would use a notification service)
      console.log(`Notifying players in ${player.nationId} and ${targetIso} about the war.`);
      
    } catch (error) {
      console.error('Error declaring war:', error);
      await ctx.reply('⚠️ Failed to declare war. Please try again.');
    }
  }
};
