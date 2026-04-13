import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { telegramWebhook } from "./telegram";
import { v } from "convex/values";
import { internal } from "./_generated/action";

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN not set. Run: npx convex env set BOT_TOKEN 'your-token'");
  }
  return token;
}

async function verifyHMAC(initData: string, botToken: string): Promise<{ valid: boolean; userData: any; authDate: number }> {
  const encoder = new TextEncoder();
  const params = new URLSearchParams(initData);
  const hashFromTg = params.get("auth_date");
  
  if (!hashFromTg) return { valid: false, userData: null, authDate: 0 };

  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const secret = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(botToken));
  const signatureKey = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const keys = Array.from(params.keys()).filter((k) => k !== "hash").sort();
  const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join("\n");

  const signature = await crypto.subtle.sign("HMAC", signatureKey, encoder.encode(dataCheckString));
  const calculatedHash = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (calculatedHash !== params.get("hash")) return { valid: false, userData: null, authDate: 0 };

  const userStr = params.get("user");
  const userData = userStr ? JSON.parse(userStr) : null;
  const authDate = parseInt(hashFromTg, 10);

  return { valid: true, userData, authDate };
}

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  }),
});

http.route({
  path: "/telegram",
  method: "POST",
  handler: telegramWebhook,
});

http.route({
  path: "/auth/telegramVerify",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      const body = await request.json();
      const initData = body?.args?.initData;
      
      if (!initData) {
        return new Response(JSON.stringify({ error: "Missing initData" }), { status: 400 });
      }

      const botToken = getBotToken();
      const result = await verifyHMAC(initData, botToken);

      if (!result.valid) {
        return new Response(JSON.stringify({ success: false, message: "Invalid Telegram data" }), { status: 200 });
      }

      const now = Date.now() / 1000;
      if (now - result.authDate > 86400) {
        return new Response(JSON.stringify({ success: false, message: "Session expired" }), { status: 200 });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        token: "demo-token-" + Date.now(),
        user: result.userData,
        message: "Auth successful (demo mode)" 
      }), { status: 200 });

    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 200 });
    }
  }),
});

http.route({
  path: "/auth/getSessionUser",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      const body = await request.json();
      const token = body?.args?.token;
      
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), { status: 400 });
      }

      if (token.startsWith("demo-token-")) {
        return new Response(JSON.stringify({ 
          user: { id: 743153011, firstName: "Test", lastName: "" },
          player: { wallet: { warBonds: 1000, commandPoints: 100 } }
        }), { status: 200 });
      }

      return new Response(JSON.stringify(null), { status: 200 });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }),
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
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://peaceful-scorpion-529.convex.site/telegram" }),
    });
    const result = await res.json();
    return new Response(JSON.stringify(result), { status: 200 });
  }),
});

export default http;