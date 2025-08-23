# 💰 Credits System Setup

## 🔧 To Complete Credits Integration:

**After running `pnpm convex dev`, you need to:**

1. **Regenerate Convex API** - The credits module isn't in the generated API yet
2. **Update Credits Display** - Uncomment the real API calls in `src/components/credits/credits-display.tsx`

## 🔨 Quick Fix:

In `src/components/credits/credits-display.tsx`, replace lines 46-47:

```typescript
// FROM:
const credits: Credits = { /* fallback data */ };
const transactions: Transaction[] = [];

// TO:
const credits = useQuery(api.credits.getUserCredits, { userId });
const transactions = useQuery(api.credits.getTransactions, { userId, limit: 20 });
```

## ✅ Current Status:

- ✅ Convex schema includes credits tables
- ✅ Credits functions fully implemented (`convex/credits.ts`)
- ✅ Credits UI component created with proper types
- ✅ 80% platform fee configured
- ✅ Integration with trading agent planned (commented in route)
- ⏳ Waiting for Convex to regenerate API types

## 🚀 Once Fixed:

The 💰 Credits tab will show:
- Real-time profit tracking
- 80% platform fee breakdown  
- Transaction history per category (trading/poker/polymarket)
- Full monetization ready!

The house always wins! 🎰
