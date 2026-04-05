import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const WAR_COOLDOWN_HOURS = 48;

function getCooldownEnd(lastWarEnded: number | undefined): number {
  if (!lastWarEnded) return 0;
  return lastWarEnded + WAR_COOLDOWN_HOURS * 60 * 60 * 1000;
}

export const getActive = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("wars")
      .withIndex("status", q => q.eq("status", "active"))
      .collect();
  },
});

export const getForNation = query({
  args: { nationIso: v.string() },
  handler: async (ctx, args) => {
    const attackerWars = await ctx.db
      .query("wars")
      .withIndex("attackerId_status", q => q.eq("attackerId", args.nationIso).eq("status", "active"))
      .collect();
    
    const defenderWars = await ctx.db
      .query("wars")
      .withIndex("defenderId_status", q => q.eq("defenderId", args.nationIso).eq("status", "active"))
      .collect();
    
    const activeWars = [...attackerWars, ...defenderWars];
    
    const allWars = await ctx.db
      .query("wars")
      .filter((q) => 
        q.or(
          q.eq(q.field("attackerId"), args.nationIso),
          q.eq(q.field("defenderId"), args.nationIso)
        )
      )
      .orderBy("startedAt", "desc")
      .take(50);
    
    return allWars;
  },
});

export const declareWar = mutation({
  args: {
    token: v.string(),
    attackerIso: v.string(),
    defenderIso: v.string(),
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
    
    const allowedRoles = ["PRESIDENT", "PRIME_MINISTER", "DEFENSE_MINISTER", "MILITARY"];
    if (!player?.role || !allowedRoles.includes(player.role.toUpperCase())) {
      throw new Error("Only Presidents and Defense Ministers can declare war");
    }
    
    const attackerNation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.attackerIso))
      .first();
    
    const defenderNation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.defenderIso))
      .first();
    
    if (!attackerNation || !defenderNation) {
      throw new Error("Nation not found");
    }
    
    if (attackerNation.atWarWith.includes(args.defenderIso)) {
      throw new Error("Already at war with this nation");
    }
    
    const existingWar = await ctx.db
      .query("wars")
      .filter((q) => 
        q.and(
          q.or(
            q.and(
              q.eq(q.field("attackerId"), args.attackerIso),
              q.eq(q.field("defenderId"), args.defenderIso)
            ),
            q.and(
              q.eq(q.field("attackerId"), args.defenderIso),
              q.eq(q.field("defenderId"), args.attackerIso)
            )
          ),
          q.eq(q.field("status"), "active")
        )
      )
      .first();
    
    if (existingWar) {
      throw new Error("Active war already exists between these nations");
    }
    
    const recentWars = await ctx.db
      .query("wars")
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("attackerId"), args.attackerIso),
            q.eq(q.field("status"), "ended")
          ),
          q.and(
            q.eq(q.field("defenderId"), args.attackerIso),
            q.eq(q.field("status"), "ended")
          )
        )
      )
      .orderBy("startedAt", "desc")
      .take(1)
      .then(wars => wars[0]);
    
    if (recentWars && recentWars.endedAt) {
      const cooldownEnd = getCooldownEnd(recentWars.endedAt);
      if (Date.now() < cooldownEnd) {
        const hoursRemaining = Math.ceil((cooldownEnd - Date.now()) / (1000 * 60 * 60));
        throw new Error(`War cooldown active. ${hoursRemaining} hours remaining.`);
      }
    }
    
    const warId = await ctx.db.insert("wars", {
      attackerId: args.attackerIso,
      defenderId: args.defenderIso,
      attackerName: attackerNation.name,
      defenderName: defenderNation.name,
      status: "active",
      startedAt: Date.now(),
      endedAt: undefined,
      winnerId: undefined,
      casualties: {
        attacker: 0,
        defender: 0,
      },
      gains: {},
      peaceOffers: [],
    });
    
    const newAttackerAtWar = [...attackerNation.atWarWith, args.defenderIso];
    const newDefenderAtWar = [...defenderNation.atWarWith, args.attackerIso];
    
    await ctx.db.patch(attackerNation._id, {
      atWarWith: newAttackerAtWar,
      updatedAt: Date.now(),
    });
    
    await ctx.db.patch(defenderNation._id, {
      atWarWith: newDefenderAtWar,
      updatedAt: Date.now(),
    });
    
    await ctx.db.insert("events", {
      type: "war_declared",
      title: "War Declared",
      description: `${attackerNation.name} has declared war on ${defenderNation.name}`,
      nationId: args.attackerIso,
      relatedNationIds: [args.attackerIso, args.defenderIso],
      data: { warId: warId.toString(), attacker: args.attackerIso, defender: args.defenderIso },
      createdAt: Date.now(),
    });
    
    return await ctx.db.get(warId);
  },
});

export const proposePeace = mutation({
  args: {
    token: v.string(),
    warId: v.id("wars"),
    fromIso: v.string(),
    toIso: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const war = await ctx.db.get(args.warId);
    
    if (!war) {
      throw new Error("War not found");
    }
    
    if (war.status !== "active") {
      throw new Error("War is not active");
    }
    
    if (![war.attackerId, war.defenderId].includes(args.fromIso)) {
      throw new Error("Not a participant in this war");
    }
    
    if (![war.attackerId, war.defenderId].includes(args.toIso)) {
      throw new Error("Invalid peace target");
    }
    
    const newPeaceOffers = [
      ...war.peaceOffers,
      {
        from: args.fromIso,
        to: args.toIso,
        offeredAt: Date.now(),
        accepted: false,
      },
    ];
    
    await ctx.db.patch(war._id, {
      peaceOffers: newPeaceOffers,
    });
    
    await ctx.db.insert("events", {
      type: "peace_proposed",
      title: "Peace Proposed",
      description: `${args.fromIso} has proposed peace to ${args.toIso}`,
      nationId: args.fromIso,
      relatedNationIds: [args.fromIso, args.toIso],
      data: { warId: war._id.toString() },
      createdAt: Date.now(),
    });
    
    return await ctx.db.get(war._id);
  },
});

export const acceptPeace = mutation({
  args: {
    token: v.string(),
    warId: v.id("wars"),
    acceptorIso: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const war = await ctx.db.get(args.warId);
    
    if (!war) {
      throw new Error("War not found");
    }
    
    if (war.status !== "active") {
      throw new Error("War is not active");
    }
    
    if (![war.attackerId, war.defenderId].includes(args.acceptorIso)) {
      throw new Error("Not a participant in this war");
    }
    
    const pendingOffer = war.peaceOffers.find(
      offer => offer.to === args.acceptorIso && !offer.accepted
    );
    
    if (!pendingOffer) {
      throw new Error("No pending peace offer");
    }
    
    const newPeaceOffers = war.peaceOffers.map(offer =>
      offer.from === pendingOffer.from && offer.to === pendingOffer.to
        ? { ...offer, accepted: true }
        : offer
    );
    
    const otherNationId = war.attackerId === args.acceptorIso ? war.defenderId : war.attackerId;
    
    const attackerNation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", war.attackerId))
      .first();
    
    const defenderNation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", war.defenderId))
      .first();
    
    let newAttackerAtWar: string[] = [];
    let newDefenderAtWar: string[] = [];
    
    if (attackerNation) {
      newAttackerAtWar = attackerNation.atWarWith.filter(id => id !== war.defenderId);
      await ctx.db.patch(attackerNation._id, {
        atWarWith: newAttackerAtWar,
        updatedAt: Date.now(),
      });
    }
    
    if (defenderNation) {
      newDefenderAtWar = defenderNation.atWarWith.filter(id => id !== war.attackerId);
      await ctx.db.patch(defenderNation._id, {
        atWarWith: newDefenderAtWar,
        updatedAt: Date.now(),
      });
    }
    
    await ctx.db.patch(war._id, {
      status: "ended",
      endedAt: Date.now(),
      winnerId: args.acceptorIso,
      peaceOffers: newPeaceOffers,
    });
    
    await ctx.db.insert("events", {
      type: "peace_accepted",
      title: "Peace Accepted",
      description: `Peace has been accepted between ${war.attackerName} and ${war.defenderName}`,
      nationId: args.acceptorIso,
      relatedNationIds: [war.attackerId, war.defenderId],
      data: { warId: war._id.toString(), winner: args.acceptorIso },
      createdAt: Date.now(),
    });
    
    return await ctx.db.get(war._id);
  },
});