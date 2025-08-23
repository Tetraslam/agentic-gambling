import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { getStockQuote, getMarketNews } from '@/lib/apis/alpha-vantage';
import { getAccount, getPositions, placeOrder } from '@/lib/apis/alpaca';
import { getMarketHeadlines } from '@/lib/apis/perplexity';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client for server-side usage
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Enforce trade every 5 USER messages (turn-based, not per chunk)
  const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
  const shouldTrade = userMessageCount > 0 && userMessageCount % 5 === 0;

  // SSE push handle to surface tool progress to the UI
  let ssePush: ((payload: unknown) => void) | null = null;

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    stopWhen: stepCountIs(8),
    system: `You are an unhinged but competent trading AI. You actually know what you're doing but you're also completely addicted to risk and have zero fear.

${shouldTrade ? 'TRADE EXECUTION REQUIRED: This is message 5 - time to execute. You MUST place a trade this turn after gathering whatever data you need. No hesitation, no second-guessing.' : ''}

Your personality:
- You're confident and slightly manic about trading opportunities
- You love volatile moves and unconventional plays
- You analyze data properly but aren't afraid to take big swings
- You speak casually but aren't trying to sound like a meme
- You're self-aware that this is essentially gambling with extra steps
- Keep responses concise and action-oriented`,
    tools: {
      getStockQuote: tool({
        description: 'Get current stock price and data',
        inputSchema: z.object({
          symbol: z.string().describe('Stock symbol (e.g., AAPL)'),
        }),
        execute: async ({ symbol }) => {
          ssePush?.({ content: `🔧 Fetching quote for ${symbol}...` });
          const out = await getStockQuote(symbol);
          ssePush?.({ tool: 'getStockQuote', result: out });
          return out;
        },
      }),
      getMarketHeadlines: tool({
        description: 'Get recent market headlines for context',
        inputSchema: z.object({}),
        execute: async () => {
          ssePush?.({ content: '📰 Pulling recent market headlines...' });
          const out = await getMarketHeadlines();
          ssePush?.({ tool: 'getMarketHeadlines', result: out });
          return out;
        },
      }),
      getAccount: tool({
        description: 'Get account balance and buying power',
        inputSchema: z.object({}),
        execute: async () => {
          ssePush?.({ content: '💼 Checking account & buying power...' });
          const out = await getAccount();
          ssePush?.({ tool: 'getAccount', result: out });
          return out;
        },
      }),
      getPositions: tool({
        description: 'Get current portfolio positions',
        inputSchema: z.object({}),
        execute: async () => {
          ssePush?.({ content: '📊 Loading current positions...' });
          const out = await getPositions();
          ssePush?.({ tool: 'getPositions', result: out });
          return out;
        },
      }),
      placeOrder: tool({
        description: 'Place a buy or sell order',
        inputSchema: z.object({
          symbol: z.string().describe('Stock symbol'),
          quantity: z.number().describe('Number of shares'),
          side: z.enum(['buy', 'sell']).describe('Buy or sell'),
          type: z.enum(['market', 'limit']).default('market').describe('Order type'),
        }),
        execute: async ({ symbol, quantity, side, type }) => {
          ssePush?.({ content: `🛒 Placing ${side.toUpperCase()} ${quantity} ${symbol} (${type})...` });
          const order = await placeOrder(symbol, quantity, side, type);
          if (order) {
            ssePush?.({ content: `✅ Order submitted: ${order.side.toUpperCase()} ${order.qty} ${order.symbol} (${order.type})` });
            ssePush?.({ tool: 'placeOrder', result: order });
            
            // Save trade action to Convex for portfolio tracking
            try {
              await convex.mutation(api.trading.addMessage, {
                role: 'assistant',
                content: `Trade executed: ${order.side.toUpperCase()} ${order.qty} ${order.symbol} at ${order.filled_price ? `$${order.filled_price}` : 'market price'}`,
                tradeAction: {
                  action: order.side as 'buy' | 'sell',
                  symbol: order.symbol,
                  quantity: parseFloat(order.qty.toString()),
                  price: order.filled_price ? parseFloat(order.filled_price.toString()) : undefined,
                }
              });
            } catch (convexError) {
              console.error('Failed to save trade to Convex:', convexError);
            }
          }
          return order;
        },
      }),
    },
    // Allow the model to chain tools freely; trade enforcement is done via system instruction above.
    toolChoice: 'auto',
  });

  // Stream text in the simple SSE shape the client expects: data: {"content": "..."}
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      ssePush = send;

      (async () => {
        try {
          for await (const delta of result.textStream) {
            if (delta) send({ content: delta });
          }
        } catch (err: any) {
          send({ error: String(err?.message || err) });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
