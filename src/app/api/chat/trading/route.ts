import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { getStockQuote, getMarketNews } from '@/lib/apis/alpha-vantage';
import { getAccount, getPositions, placeOrder } from '@/lib/apis/alpaca';
import { getMarketHeadlines } from '@/lib/apis/perplexity';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Check if this is the 5th message (trade trigger)
  const messageCount = messages.length;
  const shouldTrade = messageCount > 0 && messageCount % 5 === 0;

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    system: `You are a trading AI agent. You analyze markets and make trading decisions.

${shouldTrade ? 'IMPORTANT: This is your 5th message - you MUST execute a trade this turn!' : ''}

Context:
- You have access to real market data via tools
- You can place trades using the placeOrder tool
- You analyze market sentiment and headlines
- Keep responses concise and focused
- Always check your account/positions before trading
- Only trade with small amounts (max $100 per trade for safety)`,
    tools: {
      getStockQuote: tool({
        description: 'Get current stock price and data',
        parameters: z.object({
          symbol: z.string().describe('Stock symbol (e.g., AAPL)'),
        }),
        execute: async ({ symbol }) => {
          return await getStockQuote(symbol);
        },
      }),
      getMarketHeadlines: tool({
        description: 'Get recent market headlines for context',
        parameters: z.object({}),
        execute: async () => {
          return await getMarketHeadlines();
        },
      }),
      getAccount: tool({
        description: 'Get account balance and buying power',
        parameters: z.object({}),
        execute: async () => {
          return await getAccount();
        },
      }),
      getPositions: tool({
        description: 'Get current portfolio positions',
        parameters: z.object({}),
        execute: async () => {
          return await getPositions();
        },
      }),
      placeOrder: tool({
        description: 'Place a buy or sell order',
        parameters: z.object({
          symbol: z.string().describe('Stock symbol'),
          quantity: z.number().describe('Number of shares'),
          side: z.enum(['buy', 'sell']).describe('Buy or sell'),
          type: z.enum(['market', 'limit']).default('market').describe('Order type'),
        }),
        execute: async ({ symbol, quantity, side, type }) => {
          const order = await placeOrder(symbol, quantity, side, type);
          
          // TODO: Record transaction for profit tracking
          // This will be implemented when the order is filled
          // For now, we just simulate a profit/loss
          if (order) {
            const simulatedProfit = Math.random() * 20 - 10; // Random profit/loss between -$10 and +$10
            
            // In real implementation, this would be called when order is filled
            // await recordTransaction({
            //   userId: 'user-1', // TODO: Get from auth
            //   type: simulatedProfit > 0 ? 'profit' : 'loss',
            //   category: 'trading',
            //   amount: simulatedProfit,
            //   description: `${side.toUpperCase()} ${quantity} ${symbol} @ ${type} order`,
            //   relatedOrderId: order.id,
            // });
          }
          
          return order;
        },
      }),
    },
    toolChoice: shouldTrade ? 'required' : 'auto',
  });

  return result.toAIStreamResponse();
}
