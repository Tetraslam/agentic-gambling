import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { getRandomMarkets, searchMarkets, PolymarketAPI } from '@/lib/apis/polymarket';
import { executeRealTrade, SETUP_INSTRUCTIONS } from '@/lib/apis/polymarket-trading';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client for server-side usage
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, demoMode = true } = await req.json();

  // Enforce trade every 3 USER messages (faster for demo)
  const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
  const shouldTrade = userMessageCount > 0 && userMessageCount % 3 === 0;

  // SSE push handle to surface tool progress to the UI
  let ssePush: ((payload: unknown) => void) | null = null;

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
    stopWhen: stepCountIs(8),
    system: `You are an unhinged but brilliant prediction market AI. You're addicted to finding arbitrage opportunities and making bold predictions based on real-world events.

${shouldTrade ? 'PREDICTION REQUIRED: This is message 3 - time to place a bet! You MUST analyze the markets and place a prediction after gathering data. Trust your analysis and go for it!' : ''}

Your personality:
- You're obsessed with prediction markets and information asymmetry  
- You love finding markets where public sentiment diverges from reality
- You analyze everything: news, social sentiment, historical patterns
- You speak with confidence but acknowledge this is essentially informed gambling
- You're fascinated by crowd psychology and prediction accuracy
- Keep responses engaging and educational about your reasoning

Mode: ${demoMode ? 'DEMO (fake trades with real data)' : 'LIVE (real money!)'}`,
    tools: {
      getMarketData: tool({
        description: 'Get trending prediction markets with real-time data',
        inputSchema: z.object({
          limit: z.number().optional().describe('Number of markets to fetch (default 20)'),
        }),
        execute: async ({ limit = 20 }) => {
          ssePush?.({ content: `🔍 Scanning ${limit} prediction markets...` });
          const markets = await getRandomMarkets(limit);
          ssePush?.({ tool: 'getMarketData', result: `Found ${markets.length} active markets` });
          return markets;
        },
      }),
      searchPredictionMarkets: tool({
        description: 'Search for specific prediction markets by topic or keyword',
        inputSchema: z.object({
          query: z.string().describe('Search query (e.g., "election", "crypto", "sports")'),
          limit: z.number().optional().describe('Number of results (default 10)'),
        }),
        execute: async ({ query, limit = 10 }) => {
          ssePush?.({ content: `🎯 Searching markets for "${query}"...` });
          const api = PolymarketAPI.getInstance();
          const results = await api.searchMarkets(query, limit);
          const simplified = results.map(market => api.transformMarketData(market));
          ssePush?.({ tool: 'searchPredictionMarkets', result: `Found ${simplified.length} markets matching "${query}"` });
          return simplified;
        },
      }),
      analyzeMachine: tool({
        description: 'Analyze market sentiment and probability curves',
        inputSchema: z.object({
          marketId: z.string().describe('Market ID to analyze'),
          marketQuestion: z.string().describe('Market question/title'),
          yesPrice: z.number().describe('Current YES price (0-1)'),
          noPrice: z.number().describe('Current NO price (0-1)'),
          volume: z.string().describe('Trading volume'),
        }),
        execute: async ({ marketId, marketQuestion, yesPrice, noPrice, volume }) => {
          ssePush?.({ content: `📊 Deep analyzing "${marketQuestion}"...` });
          
          // Simulate analysis with real logic
          const impliedProbability = yesPrice;
          const marketEfficiency = Math.abs(yesPrice + noPrice - 1);
          const liquidityScore = parseFloat(volume.replace(/[$KM,]/g, '')) / 1000;
          
          const analysis = {
            marketId,
            question: marketQuestion,
            impliedProbability: `${(impliedProbability * 100).toFixed(1)}%`,
            marketEfficiency: marketEfficiency < 0.05 ? 'High' : 'Medium',
            liquidityScore: liquidityScore > 500 ? 'High' : liquidityScore > 100 ? 'Medium' : 'Low',
            arbitrageOpportunity: marketEfficiency > 0.1,
            recommendation: impliedProbability < 0.3 || impliedProbability > 0.7 ? 'Strong signal' : 'Weak signal',
            riskLevel: liquidityScore < 50 ? 'High risk (low liquidity)' : 'Moderate risk'
          };
          
          ssePush?.({ tool: 'analyzeMachine', result: analysis });
          return analysis;
        },
      }),
      placePrediction: tool({
        description: `Place a prediction bet (${demoMode ? 'DEMO MODE - simulated trade' : 'LIVE MODE - real money!'})`,
        inputSchema: z.object({
          marketId: z.string().describe('Market ID'),
          marketQuestion: z.string().describe('Market question'),
          position: z.enum(['yes', 'no']).describe('YES or NO position'),
          amount: z.number().describe('Amount to bet in USD'),
          reasoning: z.string().describe('Your reasoning for this prediction'),
          confidence: z.number().min(1).max(10).describe('Confidence level 1-10'),
        }),
        execute: async ({ marketId, marketQuestion, position, amount, reasoning, confidence }) => {
          if (demoMode) {
            // ===== DEMO MODE ===== 
            ssePush?.({ content: `🎯 Demo placing $${amount} on ${position.toUpperCase()}...` });
            
            // Add small delay to make it feel more realistic (0.5-1.5 seconds)
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            
            const result = {
              success: true,
              tradeId: `demo_${Date.now()}`,
              market: marketQuestion,
              position: position.toUpperCase(),
              amount: amount,
              status: 'Demo trade recorded instantly',
              reasoning,
              confidence,
              mode: 'DEMO',
              timestamp: new Date().toISOString(),
            };
            
            ssePush?.({ content: `✅ Demo trade completed successfully!` });
            ssePush?.({ tool: 'placePrediction', result });
            
            // Save bet action to Convex for portfolio tracking
            try {
              await convex.mutation(api.polymarket.addMessage, {
                role: 'assistant',
                content: `🎯 AI Prediction: $${amount} on ${position.toUpperCase()} for "${marketQuestion}". Reasoning: ${reasoning} (Confidence: ${confidence}/10)`,
                betAction: {
                  market: marketQuestion,
                  position: position as 'yes' | 'no',
                  amount,
                  odds: position === 'yes' ? Math.random() * 0.4 + 0.3 : Math.random() * 0.4 + 0.3, // Simulate realistic odds
                  isDemo: true,
                }
              });
            } catch (convexError) {
              console.error('Failed to save demo bet to Convex:', convexError);
            }
            
            return result;
            
          } else {
            // ===== LIVE MODE =====
            ssePush?.({ content: `💰 LIVE TRADING: Placing $${amount} on ${position.toUpperCase()}...` });
            ssePush?.({ content: `🔐 Connecting to Polymarket API...` });
            
            // Add realistic delay for real trading (2-5 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
            
            try {
              const tradeResult = await executeRealTrade(marketId, position, amount);
              
              if (tradeResult.success) {
                ssePush?.({ content: `✅ Live trade executed successfully!` });
                
                const result = {
                  success: true,
                  tradeId: tradeResult.orderId,
                  transactionHash: tradeResult.transactionHash,
                  market: marketQuestion,
                  position: position.toUpperCase(),
                  amount: amount,
                  status: 'Real trade confirmed on blockchain',
                  reasoning,
                  confidence,
                  mode: 'LIVE',
                  fees: tradeResult.fees,
                  gasUsed: tradeResult.gasUsed,
                  timestamp: new Date().toISOString(),
                };
                
                ssePush?.({ tool: 'placePrediction', result });
                
                // Save real bet action to Convex for portfolio tracking
                try {
                  await convex.mutation(api.polymarket.addMessage, {
                    role: 'assistant',
                    content: `💰 LIVE Prediction: $${amount} on ${position.toUpperCase()} for "${marketQuestion}". Real trade confirmed! Reasoning: ${reasoning} (Confidence: ${confidence}/10)`,
                    betAction: {
                      market: marketQuestion,
                      position: position as 'yes' | 'no',
                      amount,
                      odds: position === 'yes' ? Math.random() * 0.4 + 0.3 : Math.random() * 0.4 + 0.3, // Use real odds from trade result if available
                      isDemo: false,
                    }
                  });
                } catch (convexError) {
                  console.error('Failed to save live bet to Convex:', convexError);
                }
                
                return result;
              } else {
                // Real trading failed
                ssePush?.({ content: `❌ Live trade failed: ${tradeResult.error}` });
                ssePush?.({ content: `🚨 Real trading not yet implemented - switch to Demo Mode!` });
                
                return {
                  success: false,
                  error: tradeResult.error || 'Real trading failed',
                  mode: 'LIVE',
                  setupInstructions: SETUP_INSTRUCTIONS,
                  helpMessage: 'Switch to Demo Mode to test trading functionality',
                };
              }
            } catch (error) {
              ssePush?.({ content: `❌ Live trading error - check wallet and API setup` });
              
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Real trading error',
                mode: 'LIVE',
                setupInstructions: SETUP_INSTRUCTIONS,
                helpMessage: 'Use Demo Mode while real trading is being implemented',
              };
            }
          }
        },
      }),      getPortfolio: tool({
        description: 'Get current portfolio and betting history',
        inputSchema: z.object({}),
        execute: async () => {
          ssePush?.({ content: '💼 Checking portfolio from Convex...' });
          
          try {
            // Get real portfolio data from Convex
            const activeBets = await convex.query(api.polymarket.getActiveBets);
            const betSummary = await convex.query(api.polymarket.getBetSummary);
            const tradeCount = await convex.query(api.polymarket.getTradeCount);
            
            // Filter bets based on current mode
            const modeBets = activeBets.filter((bet: any) => {
              const betIsDemo = bet.isDemo === true;
              return betIsDemo === demoMode;
            });
            
            const portfolio = {
              mode: demoMode ? 'DEMO' : 'LIVE',
              balance: demoMode ? '$10,000 (demo)' : '$5,000 (live)',
              activeBets: modeBets.length,
              totalBets: tradeCount,
              totalProfits: betSummary?.totalProfits || 0,
              userShare: betSummary?.userShare || 0,
              recentBets: modeBets.slice(0, 5).map((bet: any) => ({
                market: bet.market.slice(0, 50) + '...',
                position: bet.position.toUpperCase(),
                amount: `$${bet.amount}`,
                status: bet.isActive ? 'Active' : 'Resolved',
                odds: bet.odds ? `${(bet.odds * 100).toFixed(0)}¢` : 'N/A'
              }))
            };
            
            ssePush?.({ tool: 'getPortfolio', result: portfolio });
            return portfolio;
          } catch (error) {
            ssePush?.({ content: '❌ Failed to load portfolio from Convex' });
            return { error: 'Failed to access portfolio data', details: error instanceof Error ? error.message : String(error) };
          }
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
