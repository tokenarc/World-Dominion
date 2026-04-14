import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { notifyAdmin } from "./telegram";

function calculateHumanScore(stats: any): number {
  const s = stats;
  return Math.round(
    (s.leadership * 0.20) +
    (s.strategicIq * 0.20) +
    (s.militaryIq * 0.15) +
    (s.diplomaticSkill * 0.15) +
    (s.economicAcumen * 0.15) +
    (s.intelligenceOps * 0.10) +
    (s.loyalty * 0.05)
  );
}

const ROLES = [
  { id: "president", name: "President", description: "Head of state. Supreme political authority." },
  { id: "prime_minister", name: "Prime Minister", description: "Executive leader in parliamentary systems." },
  { id: "finance_minister", name: "Finance Minister", description: "Controls national treasury and economic policy." },
  { id: "defense_minister", name: "Defense Minister", description: "Manages military affairs and defense budget." },
  { id: "foreign_minister", name: "Foreign Minister", description: "Manages diplomatic relations and treaties." },
  { id: "intelligence_chief", name: "Intelligence Chief", description: "Leads intelligence agencies and covert operations." },
  { id: "trade_minister", name: "Trade Minister", description: "Manages trade agreements and economic relations." },
  { id: "religious_leader", name: "Religious Leader", description: "Spiritual authority and religious affairs." },
];

function getRoleName(roleId: string): string {
  const role = ROLES.find(r => r.id === roleId);
  return role?.name || roleId;
}

export const submitApplication = mutation({
  args: {
    token: v.string(),
    nationIso: v.string(),
    roleId: v.string(),
    essay: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    const telegramId = session.telegramId;
    
    const player = await ctx.db
      .query("players")
      .withIndex("telegramId", q => q.eq("telegramId", telegramId))
      .first();
    
    if (!player) throw new Error("Player not found");
    
    if (player.role && player.currentNation) {
      throw new Error("You already have a role. Resign first.");
    }
    
    const pendingApps = await ctx.db
      .query("role_applications")
      .withIndex("by_player", q => q.eq("playerTelegramId", telegramId))
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();
    
    if (pendingApps.length >= 3) {
      throw new Error("Max 3 pending applications allowed");
    }
    
    const essay = args.essay.trim();
    if (essay.length < 50 || essay.length > 500) {
      throw new Error("Essay must be 50-500 characters");
    }
    
    const existingApp = await ctx.db
      .query("role_applications")
      .withIndex("by_player", q => q.eq("playerTelegramId", telegramId))
      .filter(q => q.and(
        q.eq(q.field("nationIso"), args.nationIso),
        q.eq(q.field("roleId"), args.roleId),
        q.eq(q.field("status"), "pending")
      ))
      .first();
    
    if (existingApp) {
      throw new Error("You already have a pending application for this role");
    }
    
    const nation = await ctx.db
      .query("nations")
      .withIndex("iso", q => q.eq("iso", args.nationIso))
      .first();
    
    if (!nation) throw new Error("Nation not found");
    
    const user = await ctx.db
      .query("users")
      .withIndex("telegramId", q => q.eq("telegramId", telegramId))
      .first();
    
    const now = Date.now();
    const humanScore = calculateHumanScore(player.stats || {});
    const appCount = await ctx.db.query("role_applications").collect();
    const applicationNumber = appCount.length + 1;
    
    const applicationId = await ctx.db.insert("role_applications", {
      playerTelegramId: telegramId,
      playerName: player.firstName,
      playerUsername: user?.username,
      nationIso: args.nationIso,
      nationName: nation.name,
      roleId: args.roleId,
      roleName: getRoleName(args.roleId),
      essay: args.essay,
      status: "pending",
      uid: player.uid,
      humanScore,
      statsSnapshot: player.stats,
      createdAt: now,
    });
    
    await ctx.db.insert("events", {
      type: "role_application_submitted",
      title: "Role Application Submitted",
      description: `${player.firstName} applied for ${getRoleName(args.roleId)} in ${nation.name}`,
      nationId: args.nationIso,
      relatedNationIds: [args.nationIso],
      data: { playerTelegramId: telegramId, roleId: args.roleId },
      createdAt: now,
    });
    
    const botToken = process.env.BOT_TOKEN || "";
    if (botToken) {
      await notifyAdmin(
        `🔔 <b>NEW ROLE APPLICATION</b>\n\n` +
        `🌍 Nation: <b>${nation.name}</b>\n` +
        `🎖️ Role: <b>${getRoleName(args.roleId)}</b>\n` +
        `👤 Player: @${user?.username || player.firstName} ` +
        `(<code>WD-${String(telegramId).slice(-6).toUpperCase()}</code>)\n\n` +
        `📝 Essay:\n<i>${args.essay.slice(0, 300)}</i>\n\n` +
        `<b>Review via admin panel in the app</b>`,
        botToken
      );
    }
    
    return { success: true, applicationId };
  },
});

export const getMyApplications = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", q => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }
    
    return await ctx.db
      .query("role_applications")
      .withIndex("by_player", q => q.eq("playerTelegramId", session.telegramId))
      .collect();
  },
});

export const getPendingApplications = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_SECRET;
    if (!expected || args.adminSecret !== expected) {
      throw new Error("Unauthorized");
    }
    
    return await ctx.db
      .query("role_applications")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

export const reviewApplication = mutation({
  args: {
    adminSecret: v.string(),
    applicationId: v.id("role_applications"),
    decision: v.string(),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_SECRET;
    if (!expected || args.adminSecret !== expected) {
      throw new Error("Unauthorized");
    }
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");
    
    const now = Date.now();
    
    if (args.decision === "approved") {
      const player = await ctx.db
        .query("players")
        .withIndex("telegramId", q => q.eq("telegramId", application.playerTelegramId))
        .first();
      
      if (player) {
        await ctx.db.patch(player._id, {
          nationId: application.nationIso,
          currentNation: application.nationName,
          role: application.roleId,
          currentRole: application.roleName,
          lastActive: now,
        });
      }
      
      await ctx.db.patch(args.applicationId, {
        status: "approved",
        reviewedAt: now,
        adminNote: args.adminNote,
      });
      
      await ctx.db.insert("events", {
        type: "role_assigned",
        title: "Role Assigned",
        description: `${application.playerName} is now ${application.roleName} of ${application.nationName}`,
        nationId: application.nationIso,
        relatedNationIds: [application.nationIso],
        data: { playerTelegramId: application.playerTelegramId, roleId: application.roleId },
        createdAt: now,
      });
      
      return { success: true };
    } else if (args.decision === "rejected") {
      await ctx.db.patch(args.applicationId, {
        status: "rejected",
        reviewedAt: now,
        adminNote: args.adminNote,
      });
      
      return { success: true };
    }
    
    throw new Error("Invalid decision");
  },
});

export const getApplicationsForNation = query({
  args: { nationIso: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("role_applications")
      .filter(q => q.and(
        q.eq(q.field("nationIso"), args.nationIso),
        q.eq(q.field("status"), "approved")
      ))
      .collect();
  },
});