import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const DEFAULT_NATIONS = [
  { iso: "US", name: "United States", flag: "🇺🇸", population: 331000000, gdp: 23300000000000 },
  { iso: "CN", name: "China", flag: "🇨🇳", population: 1412000000, gdp: 17700000000000 },
  { iso: "RU", name: "Russia", flag: "🇷🇺", population: 144100000, gdp: 1780000000000 },
  { iso: "GB", name: "United Kingdom", flag: "🇬🇧", population: 67800000, gdp: 3180000000000 },
  { iso: "FR", name: "France", flag: "🇫🇷", population: 67400000, gdp: 2930000000000 },
  { iso: "DE", name: "Germany", flag: "🇩🇪", population: 83200000, gdp: 4220000000000 },
  { iso: "JP", name: "Japan", flag: "🇯🇵", population: 126000000, gdp: 4940000000000 },
  { iso: "IN", name: "India", flag: "🇮🇳", population: 1380004384, gdp: 3380000000000 },
  { iso: "BR", name: "Brazil", flag: "🇧🇷", population: 212600000, gdp: 1600000000000 },
  { iso: "CA", name: "Canada", flag: "🇨🇦", population: 38000000, gdp: 1990000000000 },
  { iso: "AU", name: "Australia", flag: "🇦🇺", population: 25690000, gdp: 1700000000000 },
  { iso: "IT", name: "Italy", flag: "🇮🇹", population: 60400000, gdp: 2100000000000 },
  { iso: "KR", name: "South Korea", flag: "🇰🇷", population: 51780000, gdp: 1800000000000 },
  { iso: "MX", name: "Mexico", flag: "🇲🇽", population: 128900000, gdp: 1290000000000 },
  { iso: "ID", name: "Indonesia", flag: "🇮🇩", population: 276400000, gdp: 1310000000000 },
  { iso: "SA", name: "Saudi Arabia", flag: "🇸🇦", population: 35340000, gdp: 1040000000000 },
  { iso: "TR", name: "Turkey", flag: "🇹🇷", population: 85040000, gdp: 905000000000 },
  { iso: "IL", name: "Israel", flag: "🇮🇱", population: 9364000, gdp: 525000000000 },
  { iso: "EG", name: "Egypt", flag: "🇪🇬", population: 104100000, gdp: 404000000000 },
  { iso: "ZA", name: "South Africa", flag: "🇿🇦", population: 60140000, gdp: 405000000000 },
];

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("nations").orderBy("name").collect();
  },
});

export const getByIso = query({
  args: { iso: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.iso))
      .first();
  },
});

export const seedNations = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("nations").collect();
    
    if (existing.length > 0) {
      return { success: true, message: "Nations already seeded" };
    }
    
    const now = Date.now();
    
    for (const nation of DEFAULT_NATIONS) {
      await ctx.db.insert("nations", {
        iso: nation.iso,
        name: nation.name,
        flag: nation.flag,
        population: nation.population,
        gdp: nation.gdp,
        stability: 80 + Math.floor(Math.random() * 20),
        atWarWith: [],
        rulerId: undefined,
        rulerName: undefined,
        treasury: Math.floor(nation.gdp / 1000000),
        militaryLevel: 1 + Math.floor(Math.random() * 9),
        economyLevel: 1 + Math.floor(Math.random() * 9),
        resources: getResourcesForNation(nation.iso),
        createdAt: now,
        updatedAt: now,
      });
    }
    
    return { success: true, count: DEFAULT_NATIONS.length };
  },
});

function getResourcesForNation(iso: string): string[] {
  const resources: Record<string, string[]> = {
    US: ["oil", "technology", "agriculture", "military"],
    CN: ["manufacturing", "electronics", "rare_earth", "textiles"],
    RU: ["oil", "natural_gas", "minerals", "military"],
    GB: ["finance", "technology", "energy"],
    FR: ["agriculture", "tourism", "luxury"],
    DE: ["manufacturing", "automotive", "engineering"],
    JP: ["electronics", "automotive", "technology"],
    IN: ["it_services", "agriculture", "pharmaceuticals"],
    BR: ["agriculture", "mining", "energy"],
    AU: ["mining", "agriculture", "tourism"],
    IT: ["fashion", "tourism", "manufacturing"],
    KR: ["electronics", "automotive", "shipbuilding"],
    MX: ["manufacturing", "oil", "agriculture"],
    ID: ["coal", "palm_oil", "mining"],
    SA: ["oil", "petrochemicals"],
    TR: ["agriculture", "textiles", "tourism"],
    IL: ["technology", "diamonds", "agriculture"],
    EG: ["oil", "tourism", "agriculture"],
    ZA: ["mining", "agriculture", "finance"],
  };
  
  return resources[iso] || ["agriculture", "mining"];
}

export const updateStability = mutation({
  args: {
    token: v.string(),
    iso: v.string(),
    change: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const nation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.iso))
      .first();
    
    if (!nation) {
      throw new Error("Nation not found");
    }
    
    const newStability = Math.max(0, Math.min(100, nation.stability + args.change));
    
    await ctx.db.patch(nation._id, {
      stability: newStability,
      updatedAt: Date.now(),
    });
    
    await ctx.db.insert("events", {
      type: "stability_change",
      title: "Stability Change",
      description: `${nation.name} stability changed by ${args.change}%`,
      nationId: args.iso,
      relatedNationIds: [args.iso],
      data: { change: args.change, newStability },
      createdAt: Date.now(),
    });
    
    return await ctx.db.get(nation._id);
  },
});

export const setAtWar = mutation({
  args: {
    token: v.string(),
    iso: v.string(),
    enemyIso: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const nation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.iso))
      .first();
    
    if (!nation) {
      throw new Error("Nation not found");
    }
    
    const enemyNation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.enemyIso))
      .first();
    
    if (!enemyNation) {
      throw new Error("Enemy nation not found");
    }
    
    const newAtWarWith = [...nation.atWarWith, args.enemyIso];
    const enemyAtWarWith = [...enemyNation.atWarWith, args.iso];
    
    await ctx.db.patch(nation._id, {
      atWarWith: newAtWarWith,
      updatedAt: Date.now(),
    });
    
    await ctx.db.patch(enemyNation._id, {
      atWarWith: enemyAtWarWith,
      updatedAt: Date.now(),
    });
    
    await ctx.db.insert("events", {
      type: "war_declared",
      title: "War Declared",
      description: `${nation.name} has declared war on ${enemyNation.name}`,
      nationId: args.iso,
      relatedNationIds: [args.iso, args.enemyIso],
      data: { attacker: args.iso, defender: args.enemyIso },
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});