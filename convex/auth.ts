import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error(
      "BOT_TOKEN is not set. Run: npx convex env set BOT_TOKEN 'your-token'"
    );
  }
  return token;
}

async function debugHMAC(initData: string, botToken: string) {
  const encoder = new TextEncoder();
  const debug: any = {};

  try {
    const params = new URLSearchParams(initData);
    debug.hashFromTelegram = params.get("hash");
    debug.authDate = params.get("auth_date");
    debug.user = params.get("user");

    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign"]
    );

    const secret = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(botToken)
    );
    debug.secretKeyHex = Array.from(new Uint8Array(secret))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const signatureKey = await crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign"]
    );

    const keys = Array.from(params.keys())
      .filter((k) => k !== "hash")
      .sort();
    const dataCheckString = keys
      .map((key) => `${key}=${params.get(key)}`)
      .join("\n");
    debug.dataCheckString = dataCheckString;

    const signature = await crypto.subtle.sign(
      "HMAC",
      signatureKey,
      encoder.encode(dataCheckString)
    );
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    debug.calculatedHash = calculatedHash;
    debug.hashMatch = calculatedHash === debug.hashFromTelegram;

    if (debug.user) {
      debug.userData = JSON.parse(debug.user);
    }

    return {
      valid: debug.hashMatch,
      debug,
    };
  } catch (error: any) {
    return {
      valid: false,
      debug: {
        ...debug,
        error: error.message,
      },
    };
  }
}

export const telegramVerify = mutation({
  args: { initData: v.string(), debug: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const botToken = getBotToken();
    const startTime = Date.now();

    const result = await debugHMAC(args.initData, botToken);

    if (args.debug) {
      return {
        success: result.valid,
        debug: result.debug,
        timeMs: Date.now() - startTime,
      };
    }

    if (!result.valid) {
      console.error("[AUTH] HMAC verification failed:", result.debug);
      throw new Error(
        `Invalid Telegram initData. Hash match: ${result.debug.hashMatch}`
      );
    }

    const authDate = parseInt(result.debug.authDate || "0", 10);
    const now = Date.now() / 1000;
    if (now - authDate > 86400) {
      throw new Error("Telegram session expired (>24h old)");
    }

    const userData = result.debug.userData;
    const telegramId = userData.id;

    // Rate limiting - max 10 attempts per hour
    const recentAttempts = await ctx.db
      .query("authAttempts")
      .withIndex("telegramId_time", q => 
        q.eq("telegramId", telegramId)
         .gte("timestamp", Date.now() - 3600000)
      )
      .collect();

    if (recentAttempts.length > 10) {
      throw new Error("Too many attempts. Try again in 1 hour.");
    }

    await ctx.db.insert("authAttempts", {
      telegramId,
      timestamp: Date.now(),
      success: false,
    });

    const oldSessions = await ctx.db
      .query("sessions")
      .withIndex("telegramId", q => q.eq("telegramId", telegramId))
      .collect();

    for (const s of oldSessions) {
      await ctx.db.delete(s._id);
    }

    let user = await ctx.db
      .query("users")
      .withIndex("telegramId", q => q.eq("telegramId", telegramId))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        telegramId,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, {
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
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
        username: userData.username || userData.first_name,
        firstName: userData.first_name,
        lastName: userData.last_name,
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
      await ctx.db.patch(player._id, {
        lastActive: Date.now(),
      });
    }

    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

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
      user: {
        id: telegramId,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
      },
      player,
      timeMs: Date.now() - startTime,
    };
  },
});

export const getSessionUser = mutation({
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
    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});