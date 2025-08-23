import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Trading messages and trades
  tradingMessages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    tradeAction: v.optional(v.object({
      action: v.union(v.literal("buy"), v.literal("sell")),
      symbol: v.string(),
      quantity: v.number(),
      price: v.optional(v.number()),
    })),
  }),

  // Trading portfolio positions
  tradingPositions: defineTable({
    symbol: v.string(),
    quantity: v.number(),
    avgPrice: v.number(),
    currentPrice: v.optional(v.number()),
    timestamp: v.number(),
  }),

  // Trading portfolio P&L data
  tradingPL: defineTable({
    totalUnrealizedPL: v.number(),
    totalMarketValue: v.number(),
    totalCostBasis: v.number(),
    timestamp: v.number(),
  }),

  // Poker messages and screenshots
  pokerMessages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    screenshot: v.optional(v.string()), // base64 encoded
  }),

  // Poker game states
  pokerGameStates: defineTable({
    isPlaying: v.boolean(),
    lastAction: v.optional(v.string()),
    chipCount: v.optional(v.number()),
    timestamp: v.number(),
  }),

  // Polymarket messages and bets
  polymarketMessages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    betAction: v.optional(v.object({
      market: v.string(),
      position: v.union(v.literal("yes"), v.literal("no")),
      amount: v.number(),
      odds: v.optional(v.number()),
      isDemo: v.optional(v.boolean()), // Track demo vs real in messages too
    })),
  }),

  // Polymarket active bets - UPDATED WITH DEMO/REAL TRACKING
  polymarketBets: defineTable({
    market: v.string(),
    position: v.union(v.literal("yes"), v.literal("no")),
    amount: v.number(),
    odds: v.optional(v.number()),
    timestamp: v.number(),
    isActive: v.boolean(),
    isDemo: v.optional(v.boolean()), // Track demo vs real trades
    transactionId: v.optional(v.string()), // Real trade transaction hash
    status: v.optional(v.string()), // pending, confirmed, failed, etc.
    marketId: v.optional(v.string()), // External market ID for real trades
  }),

  // User preferences and settings
  userSettings: defineTable({
    userId: v.string(),
    activeTab: v.union(v.literal("trading"), v.literal("poker"), v.literal("polymarket"), v.literal("credits")),
    leftSidebarCollapsed: v.boolean(),
    rightSidebarCollapsed: v.boolean(),
    polymarketUnhingedMode: v.boolean(),
    polymarketDemoMode: v.optional(v.boolean()),
    tradingBalance: v.number(),
    polymarketBalance: v.number(),
  }),

  // Credits and profit tracking
  userCredits: defineTable({
    userId: v.string(),
    totalProfits: v.number(), // Total profits earned
    platformShare: v.number(), // Platform's cut of profits
    userShare: v.number(), // User's remaining profits after platform cut
    tradingProfits: v.number(), // Profits from trading
    pokerProfits: v.number(), // Profits from poker
    polymarketProfits: v.number(), // Profits from polymarket
    lastUpdated: v.number(),
  }),

  // Transaction history for profit tracking
  transactions: defineTable({
    userId: v.string(),
    type: v.union(v.literal("profit"), v.literal("loss"), v.literal("platform_fee")),
    category: v.union(v.literal("trading"), v.literal("poker"), v.literal("polymarket")),
    amount: v.number(),
    description: v.string(),
    timestamp: v.number(),
    relatedOrderId: v.optional(v.string()), // For linking to trades/bets
  }),

  // Platform revenue tracking
  platformRevenue: defineTable({
    totalRevenue: v.number(),
    tradingRevenue: v.number(),
    pokerRevenue: v.number(),
    polymarketRevenue: v.number(),
    userCount: v.number(),
    lastUpdated: v.number(),
  }),
});
