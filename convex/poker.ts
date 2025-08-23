import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all poker messages
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pokerMessages").order("desc").take(50);
  },
});

// Add a new poker message
export const addMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    screenshot: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pokerMessages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get recent screenshots
export const getScreenshots = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("pokerMessages")
      .filter((q) => q.neq(q.field("screenshot"), undefined))
      .order("desc")
      .take(10);
    
    return messages
      .map(m => m.screenshot)
      .filter(s => s !== undefined) as string[];
  },
});

// Get current game state
export const getGameState = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pokerGameStates")
      .order("desc")
      .first();
  },
});

// Update game state
export const updateGameState = mutation({
  args: {
    isPlaying: v.optional(v.boolean()),
    lastAction: v.optional(v.string()),
    chipCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentState = await ctx.db
      .query("pokerGameStates")
      .order("desc")
      .first();

    return await ctx.db.insert("pokerGameStates", {
      isPlaying: args.isPlaying ?? currentState?.isPlaying ?? false,
      lastAction: args.lastAction ?? currentState?.lastAction,
      chipCount: args.chipCount ?? currentState?.chipCount,
      timestamp: Date.now(),
    });
  },
});
