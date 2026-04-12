import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { telegramWebhook } from "./telegram";
import { telegramAuth } from "./auth";

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN not set. Run: npx convex env set BOT_TOKEN 'your-token'");
  }
  return token;
}

async function setWebhookViaAPI(botToken: string, webhookUrl: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}

async function getWebhookInfo(botToken: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  return res.json();
}

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (_ctx, _request) => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: Date.now() }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }),
});

http.route({
  path: "/telegram",
  method: "POST",
  handler: telegramWebhook,
});

http.route({
  path: "/admin/set-webhook",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const body = await request.json();
    const envSecret = process.env.ADMIN_SECRET || "dominion-admin-2026";
    if (body.adminSecret !== envSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
    const botToken = getBotToken();
    if (!botToken) {
      return new Response(JSON.stringify({ error: "BOT_TOKEN not set" }), { status: 500 });
    }
    const webhookUrl = "https://peaceful-scorpion-529.convex.site/telegram";
    const setResult = await setWebhookViaAPI(botToken, webhookUrl);
    const infoResult = await getWebhookInfo(botToken);
    return new Response(
      JSON.stringify({ setWebhook: setResult, webhookInfo: infoResult }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }),
});

export default http;