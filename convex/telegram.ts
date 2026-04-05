import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const BOT_TOKEN = process.env.BOT_TOKEN || "";

async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export const telegramWebhook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const update = body;
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || "";
      const parts = text.split(" ");
      const command = parts[0];
      
      let response = "";
      
      switch (command) {
        case "/start":
          response = "🌍 Welcome to World Dominion!\n\nUse /help to see all commands.";
          break;
        case "/help":
          response = "📋 Commands:\n/start - Start\n/economy - Economy\n/wallet - Wallet\n/war - War\n/leaderboard - Leaderboard\n/status - Status\n/nations - Nations\n/events - Events";
          break;
        case "/economy":
          response = "📈 Market: MILCOR 100, ENERTECH 85, TECHGLOBAL 150";
          break;
        case "/wallet":
          response = "💰 Wallet: 1000 WRB, 100 CP";
          break;
        case "/war":
          response = "⚔️ No active wars";
          break;
        case "/leaderboard":
          response = "🏆 Top players coming soon";
          break;
        case "/status":
          response = "✅ Bot is running";
          break;
        case "/nations":
          response = "🌍 20 nations available";
          break;
        case "/events":
          response = "📰 No recent events";
          break;
        default:
          response = "Unknown command. Use /help";
      }
      
      await sendTelegramMessage(chatId, response);
      return new Response("OK", { status: 200 });
    }
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("Error", { status: 500 });
  }
});
