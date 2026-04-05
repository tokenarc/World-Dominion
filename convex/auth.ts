import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN env var is required");

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

function parseInitData(initData: string): Map<string, string> {
  const params = new Map<string, string>();
  const pairs = initData.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value) {
      params.set(decodeURIComponent(key), decodeURIComponent(value));
    }
  }
  return params;
}

function sortAndJoin(params: Map<string, string>): string {
  const sorted = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([key, value]) => `${key}=${value}`).join("\n");
}

async function verifyInitData(initData: string): Promise<{
  user: { id: number; first_name: string; last_name?: string; username?: string };
  auth_date: number;
} | null> {
  const params = parseInitData(initData);
  const hash = params.get("hash");
  const authDate = params.get("auth_date");
  
  if (!hash || !authDate) return null;
  
  const dataCheckString = sortAndJoin(params);
  const botTokenBytes = hexToBytes(BOT_TOKEN);
  const expectedHash = bytesToHex(await hmacSha256(botTokenBytes, dataCheckString));
  
  if (expectedHash !== hash) return null;
  
  const userJson = params.get("user");
  if (!userJson) return null;
  
  try {
    const user = JSON.parse(userJson);
    return { user, auth_date: parseInt(authDate, 10) };
  } catch {
    return null;
  }
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bytesToHex(array);
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
    
    const verified = await verifyInitData(args.initData);
    if (!verified) {
      throw new Error("Invalid initData");
    }
    
    const { user, auth_date } = verified;
    const telegramId = user.id;
    
    if (Date.now() / 1000 - auth_date > 86400 * SESSION_EXPIRY_DAYS) {
      throw new Error("Session expired");
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
    
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", token))
      .first();
    
    if (existingSession) {
      await ctx.db.delete(existingSession._id);
    }
    
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