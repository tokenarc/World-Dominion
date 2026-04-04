import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_STOCKS = [
  { symbol: "MILCOR", name: "Military Corp", sector: "defense", price: 100, volume: 1000000 },
  { symbol: "ENERTECH", name: "Energy Tech", sector: "energy", price: 85, volume: 800000 },
  { symbol: "TECHGLOBAL", name: "Tech Global", sector: "technology", price: 150, volume: 1200000 },
  { symbol: "AGRIWORLD", name: "Agri World", sector: "agriculture", price: 45, volume: 500000 },
  { symbol: "BANKNAT", name: "Bank National", sector: "finance", price: 200, volume: 900000 },
];

export const getStocks = query({
  handler: async (ctx) => {
    return await ctx.db.query("stocks").orderBy("symbol").collect();
  },
});

export const getStock = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stocks")
      .withIndex("symbol", q => q.eq("symbol", args.symbol))
      .first();
  },
});

export const getListings = query({
  args: { itemType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const listings = args.itemType
      ? await ctx.db
          .query("market_listings")
          .withIndex("itemType", q => q.eq("itemType", args.itemType))
          .collect()
      : await ctx.db
          .query("market_listings")
          .collect();
    
    return listings
      .filter(l => l.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const seedStocks = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("stocks").collect();
    if (existing.length > 0) {
      return { success: true, message: "Stocks already seeded" };
    }
    
    const now = Date.now();
    for (const stock of DEFAULT_STOCKS) {
      await ctx.db.insert("stocks", {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        price: stock.price,
        change24h: 0,
        volume: stock.volume,
        marketCap: stock.price * stock.volume * 100,
        updatedAt: now,
      });
    }
    return { success: true, count: DEFAULT_STOCKS.length };
  },
});

export const createListing = mutation({
  args: {
    token: v.string(),
    itemType: v.string(),
    itemId: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
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
    
    if (!player) throw new Error("Player not found");
    
    const totalPrice = args.quantity * args.pricePerUnit;
    const now = Date.now();
    
    return await ctx.db.insert("market_listings", {
      sellerId: player._id.toString(),
      itemType: args.itemType,
      itemId: args.itemId,
      quantity: args.quantity,
      pricePerUnit: args.pricePerUnit,
      totalPrice,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const buyListing = mutation({
  args: {
    token: v.string(),
    listingId: v.id("market_listings"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const buyer = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", session.telegramId))
      .first();
    
    if (!buyer) throw new Error("Player not found");
    
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not found or inactive");
    }
    
    if (listing.sellerId === buyer._id.toString()) {
      throw new Error("Cannot buy your own listing");
    }
    
    const buyQty = Math.min(args.quantity, listing.quantity);
    const totalCost = buyQty * listing.pricePerUnit;
    
    if (buyer.wallet.warBonds < totalCost) {
      throw new Error("Insufficient funds");
    }
    
    const seller = await ctx.db.get(listing.sellerId as any);
    
    await ctx.db.patch(buyer._id, {
      wallet: {
        warBonds: buyer.wallet.warBonds - totalCost,
        commandPoints: buyer.wallet.commandPoints,
      },
      lastActive: Date.now(),
    });
    
    if (seller) {
      await ctx.db.patch(seller._id, {
        wallet: {
          warBonds: (seller.wallet.warBonds || 0) + totalCost,
          commandPoints: seller.wallet.commandPoints || 0,
        },
        lastActive: Date.now(),
      });
    }
    
    const remainingQty = listing.quantity - buyQty;
    if (remainingQty === 0) {
      await ctx.db.patch(listing._id, { status: "sold", updatedAt: Date.now() });
    } else {
      await ctx.db.patch(listing._id, {
        quantity: remainingQty,
        totalPrice: remainingQty * listing.pricePerUnit,
        updatedAt: Date.now(),
      });
    }
    
    await ctx.db.insert("transactions", {
      playerId: buyer._id.toString(),
      type: "market_purchase",
      amount: -totalCost,
      currency: "warBonds",
      description: `Purchased ${buyQty} ${listing.itemType}`,
      relatedId: listing._id.toString(),
      createdAt: Date.now(),
    });
    
    return { success: true, quantity: buyQty, totalCost };
  },
});