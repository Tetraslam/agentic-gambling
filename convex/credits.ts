// Credits and profit sharing system
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Platform takes 80% of all profits (we're basically a casino lmao)
const PLATFORM_FEE_PERCENTAGE = 0.80;

// Get user credits and profit breakdown
export const getUserCredits = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("userCredits")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!credits) {
      return {
        totalProfits: 0,
        platformShare: 0,
        userShare: 0,
        tradingProfits: 0,
        pokerProfits: 0,
        polymarketProfits: 0,
      };
    }

    return credits;
  },
});

// Initialize user credits (mutation)
export const initializeUserCredits = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userCredits")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("userCredits", {
      userId: args.userId,
      totalProfits: 0,
      platformShare: 0,
      userShare: 0,
      tradingProfits: 0,
      pokerProfits: 0,
      polymarketProfits: 0,
      lastUpdated: Date.now(),
    });
  },
});

// Record profit/loss and calculate platform fee
export const recordTransaction = mutation({
  args: {
    userId: v.string(),
    type: v.union(v.literal("profit"), v.literal("loss"), v.literal("platform_fee")),
    category: v.union(v.literal("trading"), v.literal("poker"), v.literal("polymarket")),
    amount: v.number(),
    description: v.string(),
    relatedOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert transaction record
    await ctx.db.insert("transactions", {
      ...args,
      timestamp: Date.now(),
    });

    // Update user credits
    let credits = await ctx.db
      .query("userCredits")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!credits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId: args.userId,
        totalProfits: 0,
        platformShare: 0,
        userShare: 0,
        tradingProfits: 0,
        pokerProfits: 0,
        polymarketProfits: 0,
        lastUpdated: Date.now(),
      });
      
      // Fetch the newly created credits
      credits = await ctx.db.get(creditsId);
      if (!credits) throw new Error("Failed to create credits");
    }

    let newTotalProfits = credits.totalProfits;
    let newCategoryProfits = 0;

    // Update category-specific profits
    switch (args.category) {
      case "trading":
        newCategoryProfits = credits.tradingProfits + args.amount;
        break;
      case "poker":
        newCategoryProfits = credits.pokerProfits + args.amount;
        break;
      case "polymarket":
        newCategoryProfits = credits.polymarketProfits + args.amount;
        break;
    }

    // Only apply platform fee on profits, not losses
    if (args.type === "profit" && args.amount > 0) {
      newTotalProfits += args.amount;
      const platformFee = args.amount * PLATFORM_FEE_PERCENTAGE;
      const userProfit = args.amount - platformFee;

      // Update credits
      await ctx.db.patch(credits._id, {
        totalProfits: newTotalProfits,
        platformShare: credits.platformShare + platformFee,
        userShare: credits.userShare + userProfit,
        [args.category + "Profits"]: newCategoryProfits,
        lastUpdated: Date.now(),
      });

      // Record platform fee transaction
      await ctx.db.insert("transactions", {
        userId: args.userId,
        type: "platform_fee",
        category: args.category,
        amount: platformFee,
        description: `Platform fee (${(PLATFORM_FEE_PERCENTAGE * 100)}%) on ${args.description}`,
        timestamp: Date.now(),
        relatedOrderId: args.relatedOrderId,
      });

      // Update platform revenue
      await updatePlatformRevenue(ctx, args.category, platformFee);
    } else {
      // For losses, just update totals
      newTotalProfits += args.amount; // amount will be negative for losses
      
      await ctx.db.patch(credits._id, {
        totalProfits: newTotalProfits,
        userShare: credits.userShare + args.amount,
        [args.category + "Profits"]: newCategoryProfits,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Get user transaction history
export const getTransactions = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

// Get platform revenue stats (admin only)
export const getPlatformRevenue = query({
  handler: async (ctx) => {
    const revenue = await ctx.db
      .query("platformRevenue")
      .first();

    if (!revenue) {
      return {
        totalRevenue: 0,
        tradingRevenue: 0,
        pokerRevenue: 0,
        polymarketRevenue: 0,
        userCount: 0,
      };
    }

    return revenue;
  },
});

// Helper function to update platform revenue
async function updatePlatformRevenue(
  ctx: any,
  category: "trading" | "poker" | "polymarket",
  amount: number
) {
  let revenue = await ctx.db.query("platformRevenue").first();

  if (!revenue) {
    await ctx.db.insert("platformRevenue", {
      totalRevenue: amount,
      tradingRevenue: category === "trading" ? amount : 0,
      pokerRevenue: category === "poker" ? amount : 0,
      polymarketRevenue: category === "polymarket" ? amount : 0,
      userCount: 1,
      lastUpdated: Date.now(),
    });
  } else {
    await ctx.db.patch(revenue._id, {
      totalRevenue: revenue.totalRevenue + amount,
      [category + "Revenue"]: revenue[category + "Revenue" as keyof typeof revenue] + amount,
      lastUpdated: Date.now(),
    });
  }
}

// Calculate profit from trade/bet outcome
export const calculateProfit = mutation({
  args: {
    userId: v.string(),
    category: v.union(v.literal("trading"), v.literal("poker"), v.literal("polymarket")),
    initialAmount: v.number(),
    finalAmount: v.number(),
    description: v.string(),
    relatedOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profit = args.finalAmount - args.initialAmount;
    
    // Insert transaction record
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: profit > 0 ? "profit" : "loss",
      category: args.category,
      amount: profit,
      description: args.description,
      timestamp: Date.now(),
      relatedOrderId: args.relatedOrderId,
    });

    // Update user credits (inline logic from recordTransaction)
    let credits = await ctx.db
      .query("userCredits")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!credits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId: args.userId,
        totalProfits: 0,
        platformShare: 0,
        userShare: 0,
        tradingProfits: 0,
        pokerProfits: 0,
        polymarketProfits: 0,
        lastUpdated: Date.now(),
      });
      
      credits = await ctx.db.get(creditsId);
      if (!credits) throw new Error("Failed to create credits");
    }

    let newTotalProfits = credits.totalProfits;
    let newCategoryProfits = 0;

    // Update category-specific profits
    switch (args.category) {
      case "trading":
        newCategoryProfits = credits.tradingProfits + profit;
        break;
      case "poker":
        newCategoryProfits = credits.pokerProfits + profit;
        break;
      case "polymarket":
        newCategoryProfits = credits.polymarketProfits + profit;
        break;
    }

    // Only apply platform fee on profits, not losses
    if (profit > 0) {
      newTotalProfits += profit;
      const platformFee = profit * PLATFORM_FEE_PERCENTAGE;
      const userProfit = profit - platformFee;

      // Update credits
      await ctx.db.patch(credits._id, {
        totalProfits: newTotalProfits,
        platformShare: credits.platformShare + platformFee,
        userShare: credits.userShare + userProfit,
        [args.category + "Profits"]: newCategoryProfits,
        lastUpdated: Date.now(),
      });

      // Record platform fee transaction
      await ctx.db.insert("transactions", {
        userId: args.userId,
        type: "platform_fee",
        category: args.category,
        amount: platformFee,
        description: `Platform fee (${(PLATFORM_FEE_PERCENTAGE * 100)}%) on ${args.description}`,
        timestamp: Date.now(),
        relatedOrderId: args.relatedOrderId,
      });

      // Update platform revenue
      await updatePlatformRevenue(ctx, args.category, platformFee);
    } else {
      // For losses, just update totals
      newTotalProfits += profit; // profit will be negative for losses
      
      await ctx.db.patch(credits._id, {
        totalProfits: newTotalProfits,
        userShare: credits.userShare + profit,
        [args.category + "Profits"]: newCategoryProfits,
        lastUpdated: Date.now(),
      });
    }

    return profit;
  },
});
