import { httpAction } from "./_generated/server";

// Environment variables from Convex - these MUST be set in Convex dashboard or via convex env set
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://miniapp-lyart-sigma.vercel.app";

// Debug: log what's available
console.log("[telegram] Env check - BOT_TOKEN:", BOT_TOKEN ? "set" : "NOT SET");
console.log("[telegram] Env check - WEBHOOK_SECRET:", WEBHOOK_SECRET ? "set" : "NOT SET");
console.log("[telegram] Env check - MINI_APP_URL:", MINI_APP_URL);

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) {
    console.error("[telegram] BOT_TOKEN is NOT SET - cannot send message!");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram] sendMessage failed:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
  }
}

export const telegramWebhook = httpAction(async (ctx, request) => {
  console.log("[telegram] ===== WEBHOOK CALLED =====");
  console.log("[telegram] BOT_TOKEN present:", !!BOT_TOKEN);
  
  // Webhook secret validation
  const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secretToken && secretToken !== WEBHOOK_SECRET) {
    console.log("[telegram] Secret validation FAILED, got:", secretToken, "expected:", WEBHOOK_SECRET);
  }

  try {
    const body = await request.json();
    console.log("[telegram] Received body:", JSON.stringify(body).slice(0, 500));
    const update = body;
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || "";
      const parts = text.split(" ");
      const command = parts[0];
      
      switch (command) {
        case "/start": {
          const replyMarkup = {
            inline_keyboard: [
              [{ text: "🌍 ENTER WORLD DOMINION", web_app: { url: MINI_APP_URL } }],
              [{ text: "📝 Apply for Role", callback_data: "apply_role" }, { text: "📊 World Status", callback_data: "world_status" }],
              [{ text: "❓ Help & Commands", callback_data: "help" }],
            ],
          };
          const response = "🌍 *WORLD DOMINATION*\n\nCommand 195 nations in this strategic Telegram mini-game.\n\n_Build your empire, manage your economy, and conquer the world!_\n\n⚡ 195 Nations | 💰 Economy System | ⚔️ Real-time Wars";
          await sendTelegramMessage(chatId, response, replyMarkup);
          break;
        }
        case "/help": {
          const replyMarkup = {
            inline_keyboard: [
              [{ text: "🌍 ENTER WORLD DOMINION", web_app: { url: MINI_APP_URL } }],
              [{ text: "📝 Apply for Role", callback_data: "apply_role" }],
              [{ text: "❓ Help", callback_data: "help" }],
            ],
          };
          const response = "📋 *Commands:*\n\n/start - Start the game\n/help - Show this menu\n/economy - View market\n/wallet - Your assets\n/war - Active wars\n/nations - Browse nations\n/status - Your status\n/leaderboard - Top players";
          await sendTelegramMessage(chatId, response, replyMarkup);
          break;
        }
        case "/economy": {
          const response = "📈 *Market Status*\n\n📊 MILCOR: 100\n⚡ ENERTECH: 85\n🔧 TECHGLOBAL: 150\n\n_V Prices update every 6 hours_";
          await sendTelegramMessage(chatId, response);
          break;
        }
        case "/wallet": {
          const replyMarkup = {
            inline_keyboard: [
              [{ text: "💰 Open Wallet", web_app: { url: MINI_APP_URL } }],
            ],
          };
          const response = "💰 *Your Wallet*\n\n💎 War Bonds: 1,000\n⚡ Command Points: 100\n\n_Open the app to manage your assets_";
          await sendTelegramMessage(chatId, response, replyMarkup);
          break;
        }
        case "/war": {
          const response = "⚔️ *War Room*\n\n🛡️ No active conflicts\n\n_Open the app to declare war on rival nations_";
          await sendTelegramMessage(chatId, response);
          break;
        }
        case "/leaderboard": {
          const response = "🏆 *Top Commanders*\n\n_Coming soon!_";
          await sendTelegramMessage(chatId, response);
          break;
        }
        case "/status": {
          const response = "✅ *Bot Status*\n\n🟢 Online\n🌍 195 Nations\n👥 0 Active Players\n\n_Open the app to start playing_";
          await sendTelegramMessage(chatId, response);
          break;
        }
        case "/nations": {
          const response = "🌍 *195 Nations Available*\n\n🛡️ United States\n🇷🇺 Russia\n🇨🇳 China\n🇬🇧 United Kingdom\n🇫🇷 France\n...and 190 more!\n\n_Apply for a role to claim your nation_";
          await sendTelegramMessage(chatId, response);
          break;
        }
        case "/events": {
          const response = "📰 *Recent Events*\n\n_No events yet. Start playing to see updates!_";
          await sendTelegramMessage(chatId, response);
          break;
        }
        default: {
          const response = "❓ Unknown command. Use /help";
          await sendTelegramMessage(chatId, response);
        }
      }
      
      return new Response("OK", { status: 200 });
    }
    
    if (update.callback_query) {
      const chatId = update.callback_query.message?.chat.id;
      const callbackData = update.callback_query.data;
      
      if (chatId && callbackData) {
        switch (callbackData) {
          case "apply_role":
            await sendTelegramMessage(chatId, "📝 *Apply for Role*\n\nOpen the app to apply for a nation and role!\n\n🌍 195 nations available", { inline_keyboard: [[{ text: "🌍 OPEN APP", web_app: { url: MINI_APP_URL } }]] });
            break;
          case "world_status":
            await sendTelegramMessage(chatId, "📊 *World Status*\n\n🌍 195 Nations\n⚔️ 0 Active Wars\n👥 0 Players\n💰 Economy: Active");
            break;
          case "help":
            await sendTelegramMessage(chatId, "❓ *Help & Commands*\n\n/start - Start the game\n/help - Show this menu\n/economy - View market\n/wallet - Your assets\n/war - Active wars\n/nations - Browse nations\n/status - Your status", { inline_keyboard: [[{ text: "🌍 OPEN APP", web_app: { url: MINI_APP_URL } }]] });
            break;
        }
      }
      
      return new Response("OK", { status: 200 });
    }
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});