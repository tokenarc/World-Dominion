import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("events")
      .orderBy("createdAt", "desc")
      .take(limit);
  },
});

export const getForNation = query({
  args: { nationId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("events")
      .withIndex("nationId", q => q.eq("nationId", args.nationId))
      .orderBy("createdAt", "desc")
      .take(limit);
  },
});

export const getByType = query({
  args: { type: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    return await ctx.db
      .query("events")
      .withIndex("type", q => q.eq("type", args.type))
      .orderBy("createdAt", "desc")
      .take(limit);
  },
});

export const createEvent = mutation({
  args: {
    token: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    nationId: v.optional(v.string()),
    relatedNationIds: v.optional(v.array(v.string())),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const eventId = await ctx.db.insert("events", {
      type: args.type,
      title: args.title,
      description: args.description,
      nationId: args.nationId,
      relatedNationIds: args.relatedNationIds || [],
      data: args.data || {},
      createdAt: Date.now(),
    });
    
    return await ctx.db.get(eventId);
  },
});

export const getWorldEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const warEvents = await ctx.db
      .query("events")
      .withIndex("type", q => q.eq("type", "war_declared"))
      .orderBy("createdAt", "desc")
      .take(limit);
    
    const peaceEvents = await ctx.db
      .query("events")
      .withIndex("type", q => q.eq("type", "peace_accepted"))
      .orderBy("createdAt", "desc")
      .take(limit);
    
    const allEvents = [...warEvents, ...peaceEvents].sort((a, b) => b.createdAt - a.createdAt);
    
    return allEvents.slice(0, limit);
  },
});

export const getRelated = query({
  args: { nationIds: v.array(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const events = await ctx.db
      .query("events")
      .filter((q) => q.or(...args.nationIds.map(id => q.eq(q.field("relatedNationIds"), id))))
      .orderBy("createdAt", "desc")
      .take(limit);
    
    return events;
  },
});