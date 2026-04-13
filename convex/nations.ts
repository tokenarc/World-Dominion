import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const NATIONS_DATA = [
  { id: "US", name: "United States", flag: "🇺🇸", capital: "Washington D.C.", continent: "North America", population: 331000000, gdp: 25460000, stability: 72, militaryStrength: 95, atWarWith: [], borders: ["CA", "MX"], alliances: ["NATO", "AUKUS", "QUAD"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["oil", "gas", "coal", "rare_earth", "semiconductors", "wheat", "corn"] },
  { id: "CN", name: "China", flag: "🇨🇳", capital: "Beijing", continent: "Asia", population: 1411000000, gdp: 17960000, stability: 78, militaryStrength: 88, atWarWith: [], borders: ["RU", "MN", "KZ", "KG", "TJ", "AF", "PK", "IN", "NP", "BT", "MM", "LA", "VN"], alliances: ["SCO", "BRICS"], primaryReligion: "None", ideology: "communist", resources: ["coal", "rare_earth", "semiconductors", "steel", "wheat", "rice"] },
  { id: "RU", name: "Russia", flag: "🇷🇺", capital: "Moscow", continent: "Europe", population: 145000000, gdp: 2240000, stability: 58, militaryStrength: 85, atWarWith: [], borders: ["NO", "FI", "EE", "LV", "LT", "PL", "BY", "UA", "GE", "AZ", "KZ", "CN", "MN", "KP"], alliances: ["CSTO", "SCO", "BRICS"], primaryReligion: "Christianity", ideology: "authoritarian_nationalism", resources: ["oil", "gas", "coal", "wheat", "diamonds", "rare_earth", "timber"] },
  { id: "DE", name: "Germany", flag: "🇩🇪", capital: "Berlin", continent: "Europe", population: 83000000, gdp: 4260000, stability: 82, militaryStrength: 55, atWarWith: [], borders: ["DK", "PL", "CZ", "AT", "CH", "FR", "LU", "BE", "NL"], alliances: ["NATO", "EU"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["coal", "steel", "semiconductors", "chemicals", "automotive"] },
  { id: "GB", name: "United Kingdom", flag: "🇬🇧", capital: "London", continent: "Europe", population: 67000000, gdp: 3070000, stability: 75, militaryStrength: 62, atWarWith: [], borders: ["IE"], alliances: ["NATO", "AUKUS", "Five_Eyes"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["oil", "gas", "finance", "pharmaceuticals"] },
  { id: "FR", name: "France", flag: "🇫🇷", capital: "Paris", continent: "Europe", population: 67400000, gdp: 2920000, stability: 70, militaryStrength: 65, atWarWith: [], borders: ["BE", "LU", "DE", "CH", "IT", "MC", "ES", "AD"], alliances: ["NATO", "EU"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["nuclear_power", "aerospace", "wine", "luxury_goods", "wheat"] },
  { id: "IN", name: "India", flag: "🇮🇳", capital: "New Delhi", continent: "Asia", population: 1428000000, gdp: 3730000, stability: 65, militaryStrength: 78, atWarWith: [], borders: ["PK", "CN", "NP", "BT", "BD", "MM"], alliances: ["QUAD", "BRICS", "SCO"], primaryReligion: "Hinduism", ideology: "liberal_democracy", resources: ["coal", "steel", "rice", "wheat", "pharmaceuticals", "software", "rare_earth"] },
  { id: "PK", name: "Pakistan", flag: "🇵🇰", capital: "Islamabad", continent: "Asia", population: 231000000, gdp: 376000, stability: 42, militaryStrength: 60, atWarWith: [], borders: ["IN", "CN", "AF", "IR"], alliances: ["OIC", "SCO"], primaryReligion: "Islam", ideology: "islamic_republic", resources: ["coal", "cotton", "wheat", "textiles", "gas"] },
  { id: "SA", name: "Saudi Arabia", flag: "🇸🇦", capital: "Riyadh", continent: "Asia", population: 35000000, gdp: 1100000, stability: 68, militaryStrength: 65, atWarWith: [], borders: ["JO", "IQ", "KW", "QA", "AE", "OM", "YE"], alliances: ["GCC", "OIC", "Arab_League"], primaryReligion: "Islam", ideology: "theocratic_monarchy", resources: ["oil", "gas", "gold", "phosphates"] },
  { id: "IR", name: "Iran", flag: "🇮🇷", capital: "Tehran", continent: "Asia", population: 86000000, gdp: 367000, stability: 50, militaryStrength: 62, atWarWith: [], borders: ["IQ", "TR", "AM", "AZ", "TM", "AF", "PK"], alliances: ["SCO", "Axis_of_Resistance"], primaryReligion: "Islam", ideology: "theocratic_republic", resources: ["oil", "gas", "copper", "iron", "carpets"] },
  { id: "IL", name: "Israel", flag: "🇮🇱", capital: "Jerusalem", continent: "Asia", population: 9500000, gdp: 525000, stability: 58, militaryStrength: 68, atWarWith: [], borders: ["LB", "SY", "JO", "EG"], alliances: ["US_ally"], primaryReligion: "Judaism", ideology: "liberal_democracy", resources: ["diamonds", "software", "pharmaceuticals", "gas", "desalination_tech"] },
  { id: "TR", name: "Turkey", flag: "🇹🇷", capital: "Ankara", continent: "Asia", population: 85000000, gdp: 906000, stability: 55, militaryStrength: 68, atWarWith: [], borders: ["GR", "BG", "GE", "AM", "AZ", "IR", "IQ", "SY"], alliances: ["NATO", "OIC"], primaryReligion: "Islam", ideology: "nationalist_democracy", resources: ["coal", "chromite", "copper", "boron", "textiles", "agriculture"] },
  { id: "KP", name: "North Korea", flag: "🇰🇵", capital: "Pyongyang", continent: "Asia", population: 25800000, gdp: 18000, stability: 88, militaryStrength: 65, atWarWith: [], borders: ["CN", "RU", "KR"], alliances: [], primaryReligion: "None", ideology: "juche", resources: ["coal", "iron", "zinc", "magnesite", "uranium"] },
  { id: "KR", name: "South Korea", flag: "🇰🇷", capital: "Seoul", continent: "Asia", population: 51700000, gdp: 1665000, stability: 74, militaryStrength: 72, atWarWith: [], borders: ["KP"], alliances: ["US_ally"], primaryReligion: "None", ideology: "liberal_democracy", resources: ["semiconductors", "steel", "ships", "automobiles", "electronics"] },
  { id: "JP", name: "Japan", flag: "🇯🇵", capital: "Tokyo", continent: "Asia", population: 125000000, gdp: 4230000, stability: 80, militaryStrength: 58, atWarWith: [], borders: [], alliances: ["US_ally", "QUAD", "AUKUS"], primaryReligion: "None", ideology: "liberal_democracy", resources: ["semiconductors", "automobiles", "electronics", "robotics", "fishing"] },
  { id: "BR", name: "Brazil", flag: "🇧🇷", capital: "Brasília", continent: "South America", population: 215000000, gdp: 2080000, stability: 58, militaryStrength: 55, atWarWith: [], borders: ["VE", "GY", "SR", "FR", "UY", "AR", "PY", "BO", "PE", "CO"], alliances: ["BRICS", "Mercosur"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["oil", "iron_ore", "soybeans", "sugar", "coffee", "gold", "timber"] },
  { id: "ZA", name: "South Africa", flag: "🇿🇦", capital: "Pretoria", continent: "Africa", population: 60400000, gdp: 405000, stability: 48, militaryStrength: 38, atWarWith: [], borders: ["NA", "BW", "ZW", "MZ", "SZ", "LS"], alliances: ["BRICS", "AU", "SADC"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["gold", "diamonds", "platinum", "coal", "chromium", "iron_ore"] },
  { id: "SY", name: "Syria", flag: "🇸🇾", capital: "Damascus", continent: "Asia", population: 22000000, gdp: 21000, stability: 18, militaryStrength: 30, atWarWith: [], borders: ["TR", "IQ", "JO", "IL", "LB"], alliances: ["Axis_of_Resistance"], primaryReligion: "Islam", ideology: "authoritarian_baathism", resources: ["oil", "gas", "phosphates", "cotton"] },
  { id: "AF", name: "Afghanistan", flag: "🇦🇫", capital: "Kabul", continent: "Asia", population: 40000000, gdp: 14000, stability: 22, militaryStrength: 22, atWarWith: [], borders: ["PK", "IR", "TM", "UZ", "TJ", "CN"], alliances: ["OIC"], primaryReligion: "Islam", ideology: "theocratic_emirate", resources: ["lithium", "iron", "copper", "opium", "natural_gas"] },
  { id: "UA", name: "Ukraine", flag: "🇺🇦", capital: "Kyiv", continent: "Europe", population: 43500000, gdp: 160000, stability: 35, militaryStrength: 55, atWarWith: ["RU"], borders: ["RU", "BY", "PL", "SK", "HU", "RO", "MD"], alliances: ["NATO_applicant", "EU_applicant"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["wheat", "sunflower", "steel", "coal", "manganese", "titanium", "lithium"] },
  { id: "IQ", name: "Iraq", flag: "🇮🇶", capital: "Baghdad", continent: "Asia", population: 41000000, gdp: 264000, stability: 38, militaryStrength: 42, atWarWith: [], borders: ["TR", "IR", "KW", "SA", "JO", "SY"], alliances: ["Arab_League", "OIC"], primaryReligion: "Islam", ideology: "fragile_democracy", resources: ["oil", "gas", "phosphates", "salt"] },
  { id: "VE", name: "Venezuela", flag: "🇻🇪", capital: "Caracas", continent: "South America", population: 28000000, gdp: 97000, stability: 28, militaryStrength: 32, atWarWith: [], borders: ["CO", "GY", "BR", "TT"], alliances: ["ALBA"], primaryReligion: "Christianity", ideology: "socialist", resources: ["oil", "gas", "gold", "diamonds", "bauxite", "iron"] },
  { id: "YE", name: "Yemen", flag: "🇾🇪", capital: "Sanaa", continent: "Asia", population: 32000000, gdp: 21000, stability: 5, militaryStrength: 18, atWarWith: ["SA"], borders: ["SA", "OM"], alliances: [], primaryReligion: "Islam", ideology: "failed_state", resources: ["oil", "gas", "fish", "cotton"] },
  { id: "NG", name: "Nigeria", flag: "🇳🇬", capital: "Abuja", continent: "Africa", population: 218000000, gdp: 477000, stability: 40, militaryStrength: 42, atWarWith: [], borders: ["BJ", "NE", "CM", "TD"], alliances: ["AU", "ECOWAS", "OIC"], primaryReligion: "Islam", ideology: "fragile_democracy", resources: ["oil", "gas", "tin", "iron_ore", "coal", "limestone", "niobium"] },
  { id: "EG", name: "Egypt", flag: "🇪🇬", capital: "Cairo", continent: "Africa", population: 104000000, gdp: 476000, stability: 52, militaryStrength: 55, atWarWith: [], borders: ["LY", "SD", "IL"], alliances: ["Arab_League", "AU", "OIC"], primaryReligion: "Islam", ideology: "authoritarian_military", resources: ["oil", "gas", "gold", "suez_canal", "cotton", "phosphates"] },
  { id: "AU", name: "Australia", flag: "🇦🇺", capital: "Canberra", continent: "Oceania", population: 26000000, gdp: 1690000, stability: 84, militaryStrength: 52, atWarWith: [], borders: [], alliances: ["AUKUS", "QUAD", "Five_Eyes", "NATO"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["iron_ore", "coal", "gold", "uranium", "LNG", "wheat", "wool", "rare_earth"] },
  { id: "CA", name: "Canada", flag: "🇨🇦", capital: "Ottawa", continent: "North America", population: 38000000, gdp: 2140000, stability: 82, militaryStrength: 45, atWarWith: [], borders: ["US"], alliances: ["NATO", "NORAD", "Five_Eyes", "G7"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["oil", "gas", "uranium", "potash", "lumber", "wheat", "gold", "nickel"] },
  { id: "MX", name: "Mexico", flag: "🇲🇽", capital: "Mexico City", continent: "North America", population: 130000000, gdp: 1322000, stability: 48, militaryStrength: 42, atWarWith: [], borders: ["US", "GT", "BZ"], alliances: ["OAS", "USMCA", "Pacific_Alliance"], primaryReligion: "Christianity", ideology: "liberal_democracy", resources: ["oil", "gas", "silver", "gold", "copper", "zinc", "avocados", "automobiles"] },
  { id: "ID", name: "Indonesia", flag: "🇮🇩", capital: "Jakarta", continent: "Asia", population: 273000000, gdp: 1319000, stability: 65, militaryStrength: 52, atWarWith: [], borders: ["PG", "TL", "MY"], alliances: ["ASEAN", "G20", "OIC", "BRICS"], primaryReligion: "Islam", ideology: "liberal_democracy", resources: ["palm_oil", "coal", "LNG", "nickel", "gold", "copper", "tin", "rubber"] },
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

export const getByContinent = query({
  args: { continent: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nations")
      .filter(q => q.eq(q.field("continent"), args.continent))
      .collect();
  },
});

export const seedNations = mutation({
  handler: async (ctx) => {
    let seeded = 0;
    const now = Date.now();
    
    for (const nation of NATIONS_DATA) {
      const existing = await ctx.db
        .query("nations")
        .withIndex("iso", q => q.eq("iso", nation.id))
        .first();
      
      if (existing) continue;
      
      await ctx.db.insert("nations", {
        iso: nation.id,
        name: nation.name,
        flag: nation.flag,
        capital: nation.capital,
        continent: nation.continent,
        population: nation.population,
        gdp: nation.gdp,
        stability: nation.stability,
        militaryStrength: nation.militaryStrength,
        militaryLevel: Math.ceil(nation.militaryStrength / 10),
        economyLevel: Math.ceil((nation.gdp / 1000000) / 10),
        atWarWith: nation.atWarWith || [],
        borders: nation.borders || [],
        alliances: nation.alliances || [],
        primaryReligion: nation.primaryReligion || "",
        ideology: nation.ideology || "",
        resources: nation.resources || [],
        treasury: nation.gdp ? Math.floor(nation.gdp / 10000) : 1000,
        rulerId: undefined,
        rulerName: undefined,
        createdAt: now,
        updatedAt: now,
      });
      seeded++;
    }
    
    return { success: true, count: seeded };
  },
});

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

export const clearAndReseed = mutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    const envSecret = process.env.ADMIN_SECRET || "dominion-admin-2026";
    if (args.adminSecret !== envSecret) {
      throw new Error("Unauthorized");
    }
    const all = await ctx.db.query("nations").collect();
    for (const n of all) {
      await ctx.db.delete(n._id);
    }
    return { deleted: all.length };
  },
});