import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_USER_ID = "user"; // Simple single-user setup for now

// Get user settings
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), DEFAULT_USER_ID))
      .first();

    // Return defaults if no settings exist
    return settings || {
      userId: DEFAULT_USER_ID,
      activeTab: "trading" as const,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      polymarketUnhingedMode: true,
      tradingBalance: 10000,
      polymarketBalance: 10000,
    };
  },
});

// Update user settings
export const updateSettings = mutation({
  args: {
    activeTab: v.optional(v.union(v.literal("trading"), v.literal("poker"), v.literal("polymarket"))),
    leftSidebarCollapsed: v.optional(v.boolean()),
    rightSidebarCollapsed: v.optional(v.boolean()),
    polymarketUnhingedMode: v.optional(v.boolean()),
    tradingBalance: v.optional(v.number()),
    polymarketBalance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .filter((q) => q.eq(q.field("userId"), DEFAULT_USER_ID))
      .first();

    const settingsData = {
      userId: DEFAULT_USER_ID,
      activeTab: args.activeTab || existing?.activeTab || ("trading" as const),
      leftSidebarCollapsed: args.leftSidebarCollapsed ?? existing?.leftSidebarCollapsed ?? false,
      rightSidebarCollapsed: args.rightSidebarCollapsed ?? existing?.rightSidebarCollapsed ?? false,
      polymarketUnhingedMode: args.polymarketUnhingedMode ?? existing?.polymarketUnhingedMode ?? true,
      tradingBalance: args.tradingBalance ?? existing?.tradingBalance ?? 10000,
      polymarketBalance: args.polymarketBalance ?? existing?.polymarketBalance ?? 10000,
    };

    if (existing) {
      await ctx.db.patch(existing._id, settingsData);
      return existing._id;
    } else {
      return await ctx.db.insert("userSettings", settingsData);
    }
  },
});
