import { Context } from 'telegraf'
import { getPlayer, getNation } from '../services/firebaseService'
import { declareWar, getActiveWars, getNationWars } from '../services/warService'

export const warCommand = async (ctx: Context) => {
  const player = await getPlayer(String(ctx.from!.id))

  if (!player?.currentNation) {
    return ctx.reply('⚠️ You need a nation role to declare war.\n\nUse /apply to get started.')
  }

  const args = (ctx.message as any)?.text?.split(' ')
  const targetCode = args?.[1]?.toUpperCase()

  if (!targetCode) {
    // Show current wars
    const wars = await getNationWars(player.currentNation)
    if (wars.length === 0) {
      return ctx.reply(
        `⚔️ *WAR COMMAND CENTER*\n\n${player.currentNation} is not at war.\n\nUsage: /war [nation_code]\nExample: /war RU\n\nThis will declare war on that nation.`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌍 View All Active Wars', web_app: { url: `${process.env.MINI_APP_URL}/war` } }
            ]]
          }
        }
      )
    }

    const warList = wars.map(w =>
      `⚔️ ${w.aggressorName} vs ${w.defenderName} — Score: ${w.warScore}/100 — Round: ${w.currentRound}`
    ).join('\n')

    return ctx.reply(`⚔️ *ACTIVE WARS*\n\n${warList}`, { parse_mode: 'MarkdownV2' })
  }

  // Confirm war declaration
  const target = await getNation(targetCode)
  if (!target) {
    return ctx.reply(`❌ Nation "${targetCode}" not found.\n\nExample: /war RU`)
  }

  await ctx.reply(
    `⚠️ *WAR DECLARATION*\n\nYou are about to declare war on:\n\n${target.flag || ''} *${target.name}*\nStability: ${target.stability}/100\nMilitary: ${target.militaryStrength}/100\n\nThis action cannot be undone\\. Confirm?`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⚔️ DECLARE WAR', callback_data: `confirm_war:${targetCode}` },
            { text: '❌ Cancel', callback_data: 'cancel_war' }
          ]
        ]
      }
    }
  )
}

export const handleWarAction = async (ctx: Context) => {
  const data = (ctx.callbackQuery as any)?.data
  await ctx.answerCbQuery()

  if (data === 'cancel_war') {
    return ctx.editMessageText('War declaration cancelled.')
  }

  if (data?.startsWith('confirm_war:')) {
    const targetCode = data.split(':')[1]
    const player = await getPlayer(String(ctx.from!.id))

    if (!player?.currentNation) {
      return ctx.editMessageText('❌ No nation found.')
    }

    const result = await declareWar(player.currentNation, targetCode, String(ctx.from!.id))

    if (result.success) {
      await ctx.editMessageText(
        `⚔️ WAR DECLARED!\n\n${player.currentNation} is now at war with ${targetCode}.\n\nBattle rounds every 6 hours. Check /status for updates.`
      )
    } else {
      await ctx.editMessageText(`❌ ${result.message}`)
    }
  }
}
