import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN env var is required");

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bytesToHex(array);
}

async function verifyInitData(initData: string, botToken: string): Promise<{
  user: { id: number; first_name: string; last_name?: string; username?: string };
  auth_date: number;
} | null> {
  console.log("[auth] verifyInitData called, initData length:", initData.length);
  const encoder = new TextEncoder();
  
  // Step 1 — Create secret key: HMAC-SHA256("WebAppData", botToken)
  const webAppDataKey = await crypto.subtle.importKey(
    "raw", encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const secretKeyBytes = await crypto.subtle.sign(
    "HMAC", webAppDataKey, encoder.encode(botToken)
  );
  const signingKey = await crypto.subtle.importKey(
    "raw", secretKeyBytes,
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  
  // Step 2 — Build data_check_string from URLSearchParams
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    console.log("[auth] No hash in initData");
    return null;
  }
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  console.log("[auth] data_check_string:", dataCheckString.slice(0, 200));

  // Step 3 — Calculate and compare hash
  const signature = await crypto.subtle.sign(
    "HMAC", signingKey, encoder.encode(dataCheckString)
  );
  const calculatedHash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0")).join("");

  console.log("[auth] expected hash:", hash);
  console.log("[auth] calculated hash:", calculatedHash);
  console.log("[auth] match:", calculatedHash === hash);

  if (calculatedHash !== hash) return null;

  // Step 4 — Parse user from params
  const userStr = params.get("user");
  if (!userStr) {
    console.log("[auth] No user in initData");
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    const auth_date = parseInt(params.get("auth_date") || "0", 10);
    console.log("[auth] user parsed:", user.id, user.first_name);
    return { user, auth_date };
  } catch (err) {
    console.log("[auth] JSON parse error:", err);
    return null;
  }
}

const SESSION_EXPIRY_DAYS = 7;

async function getOrCreateUser(
  ctx: any,
  telegramId: number,
  firstName: string,
  lastName?: string,
  username?: string
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("telegramId", q => q.eq("telegramId", telegramId))
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      firstName,
      lastName,
      username,
      updatedAt: Date.now(),
    });
    return existing._id;
  }
  
  const now = Date.now();
  return await ctx.db.insert("users", {
    telegramId,
    firstName,
    lastName,
    username,
    createdAt: now,
    updatedAt: now,
  });
}

async function getOrCreatePlayer(
  ctx: any,
  userId: Id<"users">,
  telegramId: number,
  firstName: string,
  lastName?: string,
  username?: string
): Promise<Doc<"players">> {
  const existing = await ctx.db
    .query("players")
    .withIndex("telegramId", q => q.eq("telegramId", telegramId))
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      lastActive: Date.now(),
    });
    return existing;
  }
  
  const now = Date.now();
  const playerId = await ctx.db.insert("players", {
    userId: userId.toString(),
    telegramId,
    username: username || firstName,
    firstName,
    lastName,
    nationId: undefined,
    currentNation: undefined,
    role: undefined,
    currentRole: undefined,
    wallet: {
      warBonds: 1000,
      commandPoints: 100,
    },
    stats: {
      totalScore: 0,
      warBonds: 1000,
      commandPoints: 100,
      reputation: 0,
      militaryKnowledge: 0,
    },
    reputation: 0,
    kycVerified: false,
    joinedAt: now,
    lastActive: now,
  });
  
  await ctx.db.insert("transactions", {
    playerId: playerId.toString(),
    type: "welcome_bonus",
    amount: 1000,
    currency: "warBonds",
    description: "Welcome bonus",
    createdAt: now,
  });
  
  await ctx.db.insert("transactions", {
    playerId: playerId.toString(),
    type: "welcome_bonus",
    amount: 100,
    currency: "commandPoints",
    description: "Welcome bonus",
    createdAt: now,
  });
  
  return await ctx.db.get(playerId);
}

export const telegramVerify = mutation({
  args: { initData: v.string() },
  handler: async (ctx, args) => {
    console.log("telegramVerify called, initData length:", args.initData.length);
    
    if (!args.initData || args.initData.length === 0) {
      throw new Error("Empty initData. Please open the app through Telegram.");
    }
    
    // FIX 12: Rate limiting - check for recent session
    const recentSession = await ctx.db
      .query("sessions")
      .filter(q => q.gte(q.field("createdAt"), Date.now() - 60000))
      .first();
    if (recentSession) {
      throw new Error("Too many auth attempts. Please wait.");
    }
    
    const verified = await verifyInitData(args.initData, BOT_TOKEN!);
    if (!verified) {
      throw new Error("Invalid initData");
    }
    
    const { user, auth_date } = verified;
    const telegramId = user.id;
    
    if (Date.now() / 1000 - auth_date > 86400 * SESSION_EXPIRY_DAYS) {
      throw new Error("Session expired");
    }
    
    // FIX 1: Delete all existing sessions for this telegramId
    const oldSessions = await ctx.db
      .query("sessions")
      .withIndex("telegramId", q => q.eq("telegramId", telegramId))
      .collect();
    for (const s of oldSessions) {
      await ctx.db.delete(s._id);
    }
    
    const userId = await getOrCreateUser(
      ctx,
      telegramId,
      user.first_name,
      user.last_name,
      user.username
    );
    
    const player = await getOrCreatePlayer(
      ctx,
      userId,
      telegramId,
      user.first_name,
      user.last_name,
      user.username
    );
    
    const token = generateToken();
    const expiresAt = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    await ctx.db.insert("sessions", {
      token,
      userId: userId.toString(),
      telegramId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
    
    return {
      success: true,
      token,
      user: {
        id: telegramId,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      },
      player,
    };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session) {
      return { valid: false };
    }
    
    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      return { valid: false };
    }
    
    return { valid: true, session };
  },
});

export const getSessionUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();
    if (!user) return null;
    
    const player = await ctx.db
      .query("players")
      .withIndex("userId", q => q.eq("userId", user._id.toString()))
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
    
    if (session) {
      await ctx.db.delete(session._id);
    }
    
    return { success: true };
  },
});