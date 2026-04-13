import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    token: v.string(),
    userId: v.string(),
    telegramId: v.number(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("token", ["token"])
    .index("userId", ["userId"])
    .index("telegramId", ["telegramId"])
    .index("expiresAt", ["expiresAt"]),

  users: defineTable({
    telegramId: v.number(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("telegramId", ["telegramId"])
    .index("username", ["username"])
    .index("createdAt", ["createdAt"]),

  players: defineTable({
    userId: v.string(),
    telegramId: v.number(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    nationId: v.optional(v.string()),
    currentNation: v.optional(v.string()),
    role: v.optional(v.string()),
    currentRole: v.optional(v.string()),
    wallet: v.object({
      warBonds: v.number(),
      commandPoints: v.number(),
    }),
    stats: v.object({
      totalScore: v.number(),
      warBonds: v.number(),
      commandPoints: v.number(),
      reputation: v.number(),
      militaryKnowledge: v.number(),
    }),
    reputation: v.number(),
    kycVerified: v.boolean(),
    joinedAt: v.number(),
    lastActive: v.number(),
  })
    .index("userId", ["userId"])
    .index("telegramId", ["telegramId"])
    .index("nationId", ["nationId"])
    .index("reputation", ["reputation"])
    .index("stats_totalScore", ["stats.totalScore"])
    .index("joinedAt", ["joinedAt"])
    .index("lastActive", ["lastActive"]),

  nations: defineTable({
    iso: v.string(),
    name: v.string(),
    flag: v.string(),
    population: v.number(),
    gdp: v.number(),
    stability: v.number(),
    atWarWith: v.array(v.string()),
    rulerId: v.optional(v.string()),
    rulerName: v.optional(v.string()),
    treasury: v.number(),
    militaryLevel: v.number(),
    economyLevel: v.number(),
    resources: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    capital: v.optional(v.string()),
    continent: v.optional(v.string()),
    ideology: v.optional(v.string()),
    militaryStrength: v.optional(v.number()),
    borders: v.optional(v.array(v.string())),
    alliances: v.optional(v.array(v.string())),
    primaryReligion: v.optional(v.string()),
  })
    .index("iso", ["iso"])
    .index("name", ["name"])
    .index("stability", ["stability"])
    .index("atWarWith", ["atWarWith"])
    .index("by_continent", ["continent"]),

  role_applications: defineTable({
    playerTelegramId: v.number(),
    playerName: v.string(),
    playerUsername: v.optional(v.string()),
    nationIso: v.string(),
    nationName: v.string(),
    roleId: v.string(),
    roleName: v.string(),
    essay: v.string(),
    status: v.string(),
    adminNote: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_player", ["playerTelegramId"])
    .index("by_status", ["status"])
    .index("by_nation", ["nationIso"])
    .index("by_player_nation", ["playerTelegramId", "nationIso"]),

  events: defineTable({
    type: v.string(),
    title: v.string(),
    description: v.string(),
    nationId: v.optional(v.string()),
    relatedNationIds: v.array(v.string()),
    data: v.any(),
    createdAt: v.number(),
  })
    .index("type", ["type"])
    .index("nationId", ["nationId"])
    .index("createdAt", ["createdAt"])
    .index("relatedNationIds", ["relatedNationIds"]),

  wars: defineTable({
    attackerId: v.string(),
    defenderId: v.string(),
    attackerName: v.string(),
    defenderName: v.string(),
    status: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    winnerId: v.optional(v.string()),
    casualties: v.object({
      attacker: v.number(),
      defender: v.number(),
    }),
    gains: v.any(),
    peaceOffers: v.array(v.object({
      from: v.string(),
      to: v.string(),
      offeredAt: v.number(),
      accepted: v.boolean(),
    })),
  })
    .index("status", ["status"])
    .index("attackerId", ["attackerId"])
    .index("defenderId", ["defenderId"])
    .index("startedAt", ["startedAt"])
    .index("attackerId_status", ["attackerId", "status"])
    .index("defenderId_status", ["defenderId", "status"]),

  stocks: defineTable({
    symbol: v.string(),
    name: v.string(),
    sector: v.string(),
    price: v.number(),
    change24h: v.number(),
    volume: v.number(),
    marketCap: v.number(),
    updatedAt: v.number(),
  })
    .index("symbol", ["symbol"])
    .index("sector", ["sector"])
    .index("price", ["price"]),

  transactions: defineTable({
    playerId: v.string(),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    relatedId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("playerId", ["playerId"])
    .index("type", ["type"])
    .index("createdAt", ["createdAt"])
    .index("playerId_createdAt", ["playerId", "createdAt"])
    .index("relatedId", ["relatedId"]),

  market_listings: defineTable({
    sellerId: v.string(),
    itemType: v.string(),
    itemId: v.optional(v.string()),
    quantity: v.number(),
    pricePerUnit: v.number(),
    totalPrice: v.number(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sellerId", ["sellerId"])
    .index("itemType", ["itemType"])
    .index("status", ["status"])
    .index("createdAt", ["createdAt"]),

  spy_missions: defineTable({
    missionId: v.string(),
    requesterId: v.string(),
    targetNationId: v.string(),
    missionType: v.string(),
    status: v.string(),
    successChance: v.number(),
    cost: v.number(),
    duration: v.number(),
    startedAt: v.number(),
    endsAt: v.number(),
    completedAt: v.optional(v.number()),
    results: v.optional(v.any()),
  })
    .index("requesterId", ["requesterId"])
    .index("targetNationId", ["targetNationId"])
    .index("status", ["status"])
    .index("endsAt", ["endsAt"])
    .index("requesterId_status", ["requesterId", "status"]),

  authAttempts: defineTable({
    telegramId: v.number(),
    timestamp: v.number(),
    success: v.boolean(),
  })
    .index("telegramId_time", ["telegramId", "timestamp"]),
});