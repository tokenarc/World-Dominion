import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { telegramWebhook } from "./telegram";
import { api } from "./_generated/api";
import { v } from "convex/values";

const ALLOWED_ORIGINS = [
  "https://miniapp-lyart-sigma.vercel.app",
  "https://miniapp-4vzbviek6-token-arcs-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN not configured");
  }
  return token;
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET not configured");
  }
  return secret;
}

function getCorsHeaders(origin: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function verifyHMAC(initData: string, botToken: string): Promise<{ valid: boolean; userData: any; authDate: number }> {
  const encoder = new TextEncoder();
  const params = new URLSearchParams(initData);
  const hashFromTg = params.get("hash");
  
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
  const authDateStr = params.get("auth_date");
  const authDate = authDateStr ? parseInt(authDateStr, 10) : 0;

  return { valid: true, userData, authDate };
}

const http = httpRouter();

const corsHeaders = getCorsHeaders("");

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      status: 200
    });
  }),
});

http.route({
  path: "/ping",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    return new Response(JSON.stringify({ pong: true, ts: Date.now() }), {
      headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      status: 200
    });
  }),
});

http.route({
  path: "/telegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    try {
      return await telegramWebhook(ctx, request);
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      });
    }
  }),
});

http.route({
  path: "/auth/telegramVerify",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);
    
    try {
      const body = await request.json();
      const initData = body?.args?.initData;
      
      if (!initData) {
        return new Response(JSON.stringify({ error: "Missing initData" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const botToken = getBotToken();
      const result = await verifyHMAC(initData, botToken);

      if (!result.valid) {
        return new Response(JSON.stringify({ success: false, message: "Invalid Telegram data" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const now = Date.now() / 1000;
      if (now - result.authDate > 86400) {
        return new Response(JSON.stringify({ success: false, message: "Session expired" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const telegramId = result.userData.id;
      
      let user = await ctx.db
        .query("users")
        .withIndex("telegramId", q => q.eq("telegramId", telegramId))
        .first();

      if (!user) {
        const userId = await ctx.db.insert("users", {
          telegramId,
          firstName: result.userData.first_name,
          lastName: result.userData.last_name,
          username: result.userData.username,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        user = await ctx.db.get(userId);
      }

      let player = await ctx.db
        .query("players")
        .withIndex("telegramId", q => q.eq("telegramId", telegramId))
        .first();

      if (!player) {
        const playerId = await ctx.db.insert("players", {
          userId: user._id,
          telegramId,
          username: result.userData.username || result.userData.first_name,
          firstName: result.userData.first_name,
          lastName: result.userData.last_name,
          stats: {
            totalScore: 0,
            humanScore: 0,
            militaryIq: 0,
            diplomaticSkill: 0,
            economicAcumen: 0,
            intelligenceOps: 0,
            leadership: 0,
            strategicIq: 0,
            reputation: 0,
            loyalty: 0,
            warBonds: 0,
            commandPoints: 0,
          },
          reputation: 0,
          kycVerified: false,
          joinedAt: Date.now(),
          lastActive: Date.now(),
        });
        player = await ctx.db.get(playerId);
      }

      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const token = Array.from(tokenArray).map((b) => b.toString(16).padStart(2, "0")).join("");
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await ctx.db.insert("sessions", {
        token,
        userId: user._id,
        telegramId,
        expiresAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return new Response(JSON.stringify({ 
        success: true, 
        token,
        user: { id: telegramId, firstName: result.userData.first_name, lastName: result.userData.last_name },
        player,
      }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
  }),
});

http.route({
  path: "/auth/getSessionUser",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);
    
    try {
      const body = await request.json();
      const token = body?.args?.token;
      
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const session = await ctx.db
        .query("sessions")
        .withIndex("token", q => q.eq("token", token))
        .first();

      if (!session || session.expiresAt < Date.now()) {
        return new Response(JSON.stringify({ error: "Invalid or expired session" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const user = await ctx.db
        .query("users")
        .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
        .first();

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const player = await ctx.db
        .query("players")
        .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
        .first();

      return new Response(
        JSON.stringify({ user, player }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
  }),
});

http.route({
  path: "/admin/set-webhook",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const origin = request.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);
    
    try {
      const body = await request.json();
      const adminSecret = body?.adminSecret;
      
      if (!adminSecret || adminSecret !== getAdminSecret()) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
      
      const botToken = getBotToken();
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://peaceful-scorpion-529.convex.site/telegram" }),
      });
      const result = await res.json();
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  }),
});

http.route({
  path: "/admin/seed-nations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);
    
    try {
      const body = await request.json();
      const adminSecret = body?.adminSecret;
      
      if (!adminSecret || adminSecret !== getAdminSecret()) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
      
      const result = await ctx.runMutation(api.nations.seedNations);
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  }),
});

http.route({
  path: "/admin/reseed-nations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);
    
    try {
      const body = await request.json();
      const adminSecret = body?.adminSecret;
      
      if (!adminSecret || adminSecret !== getAdminSecret()) {
        return new Response("Service Unavailable", { status: 503, headers: corsHeaders });
      }
      
      const cleared = await ctx.runMutation(api.nations.clearAndReseed, { adminSecret: body.adminSecret });
      const seeded = await ctx.runMutation(api.nations.seedNations);
      return new Response(JSON.stringify({ cleared, seeded }), { status: 200, headers: corsHeaders });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  }),
});

export default http;