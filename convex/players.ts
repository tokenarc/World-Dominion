import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getMe = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const player = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();
    
    if (!player) {
      throw new Error("Player not found");
    }
    
    return player;
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const players = await ctx.db
      .query("players")
      .collect();
    
    const sorted = players
      .filter(p => p.stats?.totalScore !== undefined)
      .sort((a, b) => (b.stats?.totalScore || 0) - (a.stats?.totalScore || 0))
      .slice(0, limit);
    
    return sorted;
  },
});

export const updatePlayer = mutation({
  args: {
    token: v.string(),
    nationId: v.optional(v.string()),
    currentNation: v.optional(v.string()),
    role: v.optional(v.string()),
    currentRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const player = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();
    
    if (!player) {
      throw new Error("Player not found");
    }
    
    const updates: any = {
      lastActive: Date.now(),
    };
    
    if (args.nationId !== undefined) updates.nationId = args.nationId;
    if (args.currentNation !== undefined) updates.currentNation = args.currentNation;
    if (args.role !== undefined) updates.role = args.role;
    if (args.currentRole !== undefined) updates.currentRole = args.currentRole;
    
    await ctx.db.patch(player._id, updates);
    
    return await ctx.db.get(player._id);
  },
});

export const adjustWallet = mutation({
  args: {
    token: v.string(),
    warBonds: v.optional(v.number()),
    commandPoints: v.optional(v.number()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const player = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();
    
    if (!player) {
      throw new Error("Player not found");
    }
    
    const newWarBonds = (player.wallet.warBonds || 0) + (args.warBonds || 0);
    const newCommandPoints = (player.wallet.commandPoints || 0) + (args.commandPoints || 0);
    
    if (newWarBonds < 0 || newCommandPoints < 0) {
      throw new Error("Insufficient funds");
    }
    
    await ctx.db.patch(player._id, {
      wallet: {
        warBonds: newWarBonds,
        commandPoints: newCommandPoints,
      },
      lastActive: Date.now(),
    });
    
    const now = Date.now();
    
    if (args.warBonds && args.warBonds !== 0) {
      await ctx.db.insert("transactions", {
        playerId: player._id.toString(),
        type: args.reason,
        amount: args.warBonds,
        currency: "warBonds",
        description: args.reason,
        createdAt: now,
      });
    }
    
    if (args.commandPoints && args.commandPoints !== 0) {
      await ctx.db.insert("transactions", {
        playerId: player._id.toString(),
        type: args.reason,
        amount: args.commandPoints,
        currency: "commandPoints",
        description: args.reason,
        createdAt: now,
      });
    }
    
    return await ctx.db.get(player._id);
  },
});

export const getByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", args.telegramId))
      .first();
  },
});

export const upsertByTelegramId = mutation({
  args: {
    telegramId: v.number(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", args.telegramId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        lastActive: Date.now(),
      });
      return existing;
    }
    
    const now = Date.now();
    return await ctx.db.insert("players", {
      userId: "",
      telegramId: args.telegramId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
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
  },
});