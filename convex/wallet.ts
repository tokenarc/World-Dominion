import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

const DEPOSIT_ADDRESS = process.env.DEPOSIT_ADDRESS || "UQ_deposit_address_placeholder";
const USDT_CONTRACT = process.env.USDT_CONTRACT || "EQDccccccccccccccccccccccccccccccccccccccccccccccc";

export const getBalance = query({
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
    
    return player.wallet;
  },
});

export const getTransactions = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
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
    
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("transactions")
      .withIndex("playerId", q => q.eq("playerId", player._id.toString()))
      .orderBy("createdAt", "desc")
      .take(limit);
  },
});

export const checkTxHash = query({
  args: { txHash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .filter(q => q.eq(q.field("relatedId"), args.txHash))
      .first();
    
    return existing ? true : false;
  },
});

export const initiateDeposit = mutation({
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
    
    const depositId = `deposit_${Date.now()}_${player.telegramId}`;
    
    await ctx.db.insert("transactions", {
      playerId: player._id.toString(),
      type: "deposit_pending",
      amount: 0,
      currency: "warBonds",
      description: "Pending deposit",
      relatedId: depositId,
      createdAt: Date.now(),
    });
    
    return {
      depositId,
      walletAddress: DEPOSIT_ADDRESS,
      usdtContract: USDT_CONTRACT,
      instructions: "Send USDT (TRC20) to the address above. Use depositId as memo.",
    };
  },
});

export const verifyDeposit = mutation({
  args: { token: v.string(), txHash: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .filter(q => q.eq(q.field("relatedId"), args.txHash))
      .first();
    
    if (existing) {
      return { success: false, message: "Transaction already processed" };
    }
    
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      return { success: false, message: "Invalid session" };
    }
    
    const player = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();
    
    if (!player) {
      return { success: false, message: "Player not found" };
    }
    
    const wrbAmount = args.amount * 100;
    
    await ctx.db.patch(player._id, {
      wallet: {
        warBonds: player.wallet.warBonds + wrbAmount,
        commandPoints: player.wallet.commandPoints,
      },
      lastActive: Date.now(),
    });
    
    await ctx.db.insert("transactions", {
      playerId: player._id.toString(),
      type: "deposit",
      amount: wrbAmount,
      currency: "warBonds",
      description: `Deposit verified: ${args.amount} USDT`,
      relatedId: args.txHash,
      createdAt: Date.now(),
    });
    
    return { success: true, amount: wrbAmount };
  },
});

export const initiateWithdrawal = mutation({
  args: {
    token: v.string(),
    amount: v.number(),
    walletAddress: v.string(),
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
    
    const wrbAmount = Math.floor(args.amount);
    
    if (player.wallet.warBonds < wrbAmount) {
      throw new Error("Insufficient balance");
    }
    
    const usdtAmount = wrbAmount / 100;
    
    await ctx.db.patch(player._id, {
      wallet: {
        warBonds: player.wallet.warBonds - wrbAmount,
        commandPoints: player.wallet.commandPoints,
      },
      lastActive: Date.now(),
    });
    
    const withdrawalId = `withdrawal_${Date.now()}_${player.telegramId}`;
    
    await ctx.db.insert("transactions", {
      playerId: player._id.toString(),
      type: "withdrawal_pending",
      amount: -wrbAmount,
      currency: "warBonds",
      description: `Pending withdrawal to ${args.walletAddress}`,
      relatedId: withdrawalId,
      createdAt: Date.now(),
    });
    
    return {
      withdrawalId,
      amount: usdtAmount,
      walletAddress: args.walletAddress,
      status: "pending",
    };
  },
});