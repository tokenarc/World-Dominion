import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN not set");
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

export const telegramVerify = mutation({
  args: { initData: v.string() },
  handler: async (ctx, args) => {
    const botToken = getBotToken();
    const result = await verifyHMAC(args.initData, botToken);

    if (!result.valid) {
      throw new Error("Invalid Telegram data");
    }

    const now = Date.now() / 1000;
    if (now - result.authDate > 86400) {
      throw new Error("Session expired. Reopen from Telegram.");
    }

    const telegramId = result.userData.id;
    const oldSessions = await ctx.db
      .query("sessions")
      .withIndex("telegramId", q => q.eq("telegramId", telegramId))
      .collect();

    for (const s of oldSessions) await ctx.db.delete(s._id);

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
    } else {
      await ctx.db.patch(user._id, {
        firstName: result.userData.first_name,
        lastName: result.userData.last_name,
        username: result.userData.username,
        updatedAt: Date.now(),
      });
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
        nationId: undefined,
        currentNation: undefined,
        role: undefined,
        currentRole: undefined,
        wallet: { warBonds: 1000, commandPoints: 100 },
        stats: {
          totalScore: 0,
          warBonds: 1000,
          commandPoints: 100,
          reputation: 50,
          militaryKnowledge: 0,
        },
        reputation: 50,
        kycVerified: false,
        joinedAt: Date.now(),
        lastActive: Date.now(),
      });
      player = await ctx.db.get(playerId);

      await ctx.db.insert("transactions", {
        playerId: playerId,
        type: "welcome_bonus",
        amount: 1000,
        currency: "warBonds",
        description: "Welcome to World Dominion",
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(player._id, { lastActive: Date.now() });
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

    return {
      success: true,
      token,
      user: { id: telegramId, firstName: result.userData.first_name, lastName: result.userData.last_name },
      player,
    };
  },
});

export const getSessionUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();

    if (!user) return null;

    const player = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();

    return { user, player };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    if (session) await ctx.db.delete(session._id);
    return { success: true };
  },
});