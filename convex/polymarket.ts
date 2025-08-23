import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_USER_ID = "user"; // Same as userSettings

// Get all polymarket messages
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("polymarketMessages").order("desc").take(50);
  },
});

// Add a new polymarket message with proper demo/real tracking
export const addMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    betAction: v.optional(v.object({
      market: v.string(),
      position: v.union(v.literal("yes"), v.literal("no")),
      amount: v.number(),
      odds: v.optional(v.number()),
      isDemo: v.optional(v.boolean()), // Track demo vs real
    })),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("polymarketMessages", {
      ...args,
      timestamp: Date.now(),
    });

    // If there's a bet action, add it to active bets with proper tracking
    if (args.betAction) {
      await ctx.db.insert("polymarketBets", {
        market: args.betAction.market,
        position: args.betAction.position,
        amount: args.betAction.amount,
        odds: args.betAction.odds,
        timestamp: Date.now(),
        isActive: true,
        isDemo: args.betAction.isDemo ?? true, // Default to demo if not specified
        status: args.betAction.isDemo ? "demo" : "pending", // Set appropriate status
      });
    }

    return messageId;
  },
});

// Get active bets with demo/real distinction
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

// Get demo bets only
export const getDemoBets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("polymarketBets")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.eq(q.field("isDemo"), true)
      ))
      .order("desc")
      .collect();
  },
});

// Get real bets only
export const getRealBets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("polymarketBets")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.eq(q.field("isDemo"), false)
      ))
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

// Resolve a bet and calculate profits/losses with demo/real distinction
export const resolveBet = mutation({
  args: {
    betId: v.id("polymarketBets"),
    marketOutcome: v.union(v.literal("yes"), v.literal("no")),
    finalOdds: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    profit: number;
    didWin: boolean;
    finalAmount: number;
    description: string;
    isDemo: boolean;
  }> => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) {
      throw new Error("Bet not found");
    }

    // Calculate win/loss
    const didWin = bet.position === args.marketOutcome;
    let finalAmount = 0;
    
    if (didWin) {
      // Won the bet - calculate payout based on odds
      const odds = args.finalOdds || bet.odds || 0.5;
      finalAmount = bet.amount / odds; // Payout calculation
    } else {
      // Lost the bet
      finalAmount = 0;
    }

    const profit = finalAmount - bet.amount;
    const isDemo = bet.isDemo ?? true;

    // Update the bet with outcome
    await ctx.db.patch(args.betId, {
      isActive: false,
      status: didWin ? "won" : "lost",
    });

    return {
      profit,
      didWin,
      finalAmount,
      description: `${didWin ? 'Won' : 'Lost'} $${Math.abs(profit).toFixed(2)} on "${bet.market}"${isDemo ? ' (Demo)' : ' (Real)'}`,
      isDemo,
    };
  },
});

// Simulate bet resolution (for demo purposes)
export const simulateBetResolution = mutation({
  args: {
    betId: v.id("polymarketBets"),
  },
  handler: async (ctx, args): Promise<{
    profit: number;
    didWin: boolean;
    finalAmount: number;
    description: string;
    isDemo: boolean;
  }> => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) {
      throw new Error("Bet not found");
    }

    // Only allow simulation for demo bets
    if (!bet.isDemo) {
      throw new Error("Cannot simulate resolution for real bets");
    }

    // Simulate random outcome (60% chance of winning for demo)
    const didWin = Math.random() > 0.4;
    const simulatedOutcome: "yes" | "no" = didWin ? bet.position : (bet.position === 'yes' ? 'no' : 'yes');
    
    // Calculate win/loss directly (same logic as resolveBet)
    let finalAmount = 0;
    
    if (didWin) {
      // Won the bet - calculate payout based on odds
      const odds = bet.odds || 0.5;
      finalAmount = bet.amount / odds; // Payout calculation
    } else {
      // Lost the bet
      finalAmount = 0;
    }

    const profit = finalAmount - bet.amount;

    // Update the bet with outcome
    await ctx.db.patch(args.betId, {
      isActive: false,
      status: didWin ? "won" : "lost",
    });

    return {
      profit,
      didWin,
      finalAmount,
      description: `${didWin ? 'Won' : 'Lost'} $${Math.abs(profit).toFixed(2)} on "${bet.market}" (Demo)`,
      isDemo: true,
    };
  },
});

// Get bet profit/loss summary with demo/real breakdown
export const getBetSummary = query({
  args: {},
  handler: async (ctx): Promise<{
    totalBets: number;
    activeBets: number;
    resolvedBets: number;
    demoBets: number;
    realBets: number;
    totalProfits: number;
    platformFees: number;
    userShare: number;
  }> => {
    const bets = await ctx.db.query("polymarketBets").collect();
    const activeBets = bets.filter(bet => bet.isActive);
    const resolvedBets = bets.filter(bet => !bet.isActive);
    const demoBets = bets.filter(bet => bet.isDemo);
    const realBets = bets.filter(bet => !bet.isDemo);
    
    // Get user credits for polymarket profits
    const credits = await ctx.db
      .query("userCredits")
      .filter((q) => q.eq(q.field("userId"), DEFAULT_USER_ID))
      .first();

    return {
      totalBets: bets.length,
      activeBets: activeBets.length,
      resolvedBets: resolvedBets.length,
      demoBets: demoBets.length,
      realBets: realBets.length,
      totalProfits: credits?.polymarketProfits || 0,
      platformFees: credits?.platformShare || 0,
      userShare: credits?.userShare || 0,
    };
  },
});
