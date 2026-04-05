import { action } from "./_generated/server";

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export const setWebhook = action(async () => {
  if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set");
  }
  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET environment variable is not set");
  }

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://wary-stork-787.convex.site/telegram",
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  });

  const result = await response.json();
  return result;
});

export const getWebhookInfo = action(async () => {
  if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set");
  }

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const result = await response.json();
  return result;
});