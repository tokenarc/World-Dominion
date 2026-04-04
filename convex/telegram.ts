import { httpAction } from "./_generated/server";
import { internal } from "./_generated/action";

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
      
      return new Response(JSON.stringify({
        method: "sendMessage",
        chat_id: chatId,
        text: response,
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    if (update.callback_query) {
      return new Response(JSON.stringify({
        method: "answerCallbackQuery",
        callback_query_id: update.callback_query.id,
        text: "Processed",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});