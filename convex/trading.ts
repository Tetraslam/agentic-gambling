import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all trading messages
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tradingMessages").order("desc").take(50);
  },
});

// Add a new trading message
export const addMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    tradeAction: v.optional(v.object({
      action: v.union(v.literal("buy"), v.literal("sell")),
      symbol: v.string(),
      quantity: v.number(),
      price: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("tradingMessages", {
      ...args,
      timestamp: Date.now(),
    });

    // If there's a trade action, update portfolio
    if (args.tradeAction) {
      const existingPosition = await ctx.db
        .query("tradingPositions")
        .filter((q) => q.eq(q.field("symbol"), args.tradeAction!.symbol))
        .first();

      if (existingPosition) {
        // Update existing position
        const newQuantity = args.tradeAction.action === "buy" 
          ? existingPosition.quantity + args.tradeAction.quantity
          : existingPosition.quantity - args.tradeAction.quantity;

        if (newQuantity <= 0) {
          // Close position if quantity is 0 or negative
          await ctx.db.delete(existingPosition._id);
        } else {
          // Update position
          const newAvgPrice = args.tradeAction.action === "buy"
            ? ((existingPosition.avgPrice * existingPosition.quantity) + 
               ((args.tradeAction.price || 0) * args.tradeAction.quantity)) / newQuantity
            : existingPosition.avgPrice; // Keep same avg price for sells

          await ctx.db.patch(existingPosition._id, {
            quantity: newQuantity,
            avgPrice: newAvgPrice,
            timestamp: Date.now(),
          });
        }
      } else if (args.tradeAction.action === "buy") {
        // Create new position for buys only
        await ctx.db.insert("tradingPositions", {
          symbol: args.tradeAction.symbol,
          quantity: args.tradeAction.quantity,
          avgPrice: args.tradeAction.price || 0,
          timestamp: Date.now(),
        });
      }
    }

    return messageId;
  },
});

// Get current portfolio
export const getPortfolio = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tradingPositions").collect();
  },
});

// Get message count for trade timing
export const getMessageCount = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("tradingMessages").collect();
    return messages.length;
  },
});

// Update portfolio P&L data from Alpaca
export const updatePortfolioPL = mutation({
  args: {
    totalUnrealizedPL: v.number(),
    totalMarketValue: v.number(),
    totalCostBasis: v.number(),
  },
  handler: async (ctx, args) => {
    // For now, we'll just store the latest P&L data
    // In a real app, you'd want to store historical data
    const existingPL = await ctx.db
      .query("tradingPL")
      .order("desc")
      .first();

    const plData = {
      totalUnrealizedPL: args.totalUnrealizedPL,
      totalMarketValue: args.totalMarketValue,
      totalCostBasis: args.totalCostBasis,
      timestamp: Date.now(),
    };

    if (existingPL) {
      await ctx.db.patch(existingPL._id, plData);
      return existingPL._id;
    } else {
      return await ctx.db.insert("tradingPL", plData);
    }
  },
});

// Get current portfolio P&L
export const getCurrentPL = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tradingPL")
      .order("desc")
      .first();
  },
});
