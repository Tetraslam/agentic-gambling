import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all polymarket messages
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("polymarketMessages").order("desc").take(50);
  },
});

// Add a new polymarket message
export const addMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    betAction: v.optional(v.object({
      market: v.string(),
      position: v.union(v.literal("yes"), v.literal("no")),
      amount: v.number(),
      odds: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("polymarketMessages", {
      ...args,
      timestamp: Date.now(),
    });

    // If there's a bet action, add it to active bets
    if (args.betAction) {
      await ctx.db.insert("polymarketBets", {
        ...args.betAction,
        timestamp: Date.now(),
        isActive: true,
      });
    }

    return messageId;
  },
});

// Get active bets
export const getActiveBets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("polymarketBets")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Get trade count
export const getTradeCount = query({
  args: {},
  handler: async (ctx) => {
    const bets = await ctx.db.query("polymarketBets").collect();
    return bets.length;
  },
});

// Close a bet
export const closeBet = mutation({
  args: {
    betId: v.id("polymarketBets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.betId, {
      isActive: false,
    });
  },
});
