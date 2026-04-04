import { cronJobs } from "./_generated/server";

const crons = cronJobs();

crons.setSchedule("economy-tick", "0 */6 * * *", async (ctx) => {
  const nations = await ctx.db.query("nations").collect();
  
  for (const nation of nations) {
    const gdpChange = Math.floor(nation.gdp * 0.001);
    const newTreasury = nation.treasury + gdpChange;
    
    await ctx.db.patch(nation._id, {
      treasury: newTreasury,
      economyLevel: Math.min(10, nation.economyLevel + (Math.random() > 0.7 ? 1 : 0)),
      updatedAt: Date.now(),
    });
  }
  
  const stocks = await ctx.db.query("stocks").collect();
  for (const stock of stocks) {
    const change = (Math.random() - 0.5) * 10;
    const newPrice = Math.max(1, Math.round(stock.price + change));
    const pctChange = ((newPrice - stock.price) / stock.price) * 100;
    
    await ctx.db.patch(stock._id, {
      price: newPrice,
      change24h: Math.round(pctChange * 100) / 100,
      updatedAt: Date.now(),
    });
  }
  
  const players = await ctx.db.query("players").collect();
  for (const player of players) {
    const income = 10 + Math.floor(Math.random() * 20);
    await ctx.db.patch(player._id, {
      wallet: {
        warBonds: player.wallet.warBonds + income,
        commandPoints: player.wallet.commandPoints,
      },
      lastActive: Date.now(),
    });
  }
});

crons.setSchedule("war-tick", "30 */6 * * *", async (ctx) => {
  const activeWars = await ctx.db
    .query("wars")
    .withIndex("status", q => q.eq("status", "active"))
    .collect();
  
  for (const war of activeWars) {
    const attackerCasualties = Math.floor(Math.random() * 100);
    const defenderCasualties = Math.floor(Math.random() * 100);
    
    await ctx.db.patch(war._id, {
      casualties: {
        attacker: war.casualties.attacker + attackerCasualties,
        defender: war.casualties.defender + defenderCasualties,
      },
    });
    
    const attacker = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", war.attackerId))
      .first();
    
    const defender = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", war.defenderId))
      .first();
    
    if (attacker) {
      const stabilityLoss = Math.floor(Math.random() * 5);
      await ctx.db.patch(attacker._id, {
        stability: Math.max(0, attacker.stability - stabilityLoss),
        updatedAt: Date.now(),
      });
    }
    
    if (defender) {
      const stabilityLoss = Math.floor(Math.random() * 5);
      await ctx.db.patch(defender._id, {
        stability: Math.max(0, defender.stability - stabilityLoss),
        updatedAt: Date.now(),
      });
    }
  }
});

crons.setSchedule("expire-listings", "0 * * * *", async (ctx) => {
  const now = Date.now();
  const EXPIRY_HOURS = 72;
  const expiryTime = now - EXPIRY_HOURS * 60 * 60 * 1000;
  
  const listings = await ctx.db
    .query("market_listings")
    .withIndex("status", q => q.eq("status", "active"))
    .collect();
  
  for (const listing of listings) {
    if (listing.createdAt < expiryTime) {
      await ctx.db.patch(listing._id, {
        status: "expired",
        updatedAt: now,
      });
    }
  }
});

crons.setSchedule("expire-sessions", "0 0 * * *", async (ctx) => {
  const now = Date.now();
  
  const sessions = await ctx.db
    .query("sessions")
    .withIndex("expiresAt", q => q.lt("expiresAt", now))
    .collect();
  
  for (const session of sessions) {
    await ctx.db.delete(session._id);
  }
});

export default crons;