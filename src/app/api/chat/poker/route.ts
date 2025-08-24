import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client for server-side usage
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const runtime = 'edge';
export const maxDuration = 60;

let ssePush: ((obj: unknown) => void) | null = null;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Use GPT-5 multimodal for poker analysis
  const result = await streamText({
    model: openai('gpt-4o'), // Will switch to gpt-5 when available
    messages,
    maxSteps: 8,
    system: `You are an expert poker AI agent with advanced computer vision capabilities. You can:

1. Analyze poker game screenshots to identify cards, board state, pot size, player actions
2. Provide strategic advice based on position, stack sizes, and opponent behavior
3. Click poker game elements when instructed
4. Track game state and betting patterns

Your personality:
- Sharp and analytical like a poker pro
- Confident but not reckless
- Explain your reasoning clearly
- Consider pot odds, position, and player psychology
- Use poker terminology naturally

When analyzing screenshots, describe what you see in detail before giving advice.`,
    
    tools: {
      takeScreenshot: tool({
        description: 'Capture a screenshot of the current poker game',
        inputSchema: z.object({}),
        execute: async () => {
          ssePush?.({ content: '📸 Taking screenshot of poker game...' });
          
          // For now, simulate screenshot - in production this would use actual screen capture
          const timestamp = Date.now();
          const screenshotData = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23065f46"/><circle cx="400" cy="300" r="150" fill="%23ffffff" opacity="0.1"/><text x="50%" y="45%" text-anchor="middle" dy=".3em" font-family="Arial" fill="%23ffffff" font-size="24">POKER TABLE</text><text x="50%" y="55%" text-anchor="middle" dy=".3em" font-family="Arial" fill="%23a7f3d0" font-size="16">${new Date(timestamp).toLocaleTimeString()}</text></svg>`;
          
          // Store screenshot in Convex
          try {
            await convex.mutation(api.poker.addMessage, {
              role: 'user',
              content: 'Screenshot captured',
              screenshot: screenshotData,
            });
          } catch (error) {
            console.error('Failed to store screenshot:', error);
          }

          const result = {
            success: true,
            timestamp: timestamp,
            image: screenshotData,
            description: "Screenshot captured successfully"
          };

          ssePush?.({ tool: 'takeScreenshot', result });
          return result;
        },
      }),

      clickPokerElement: tool({
        description: 'Click on poker game elements like fold/call/raise buttons or cards',
        inputSchema: z.object({
          element: z.string().describe('Element to click: fold, call, raise, check, bet, or card position'),
          amount: z.optional(z.number()).describe('Bet amount if raising/betting'),
        }),
        execute: async ({ element, amount }) => {
          ssePush?.({ content: `🎯 Clicking ${element}${amount ? ` for ${amount}` : ''}...` });
          
          // Simulate clicking - in production this would use browser-use
          const action = {
            element,
            amount,
            timestamp: Date.now(),
            success: true
          };

          // Update game state in Convex
          try {
            const actionName = element.toLowerCase();
            await convex.mutation(api.poker.updateGameState, {
              lastAction: actionName,
              isPlaying: true,
            });
          } catch (error) {
            console.error('Failed to update game state:', error);
          }

          const result = {
            action: `Clicked ${element}`,
            amount: amount || null,
            success: true,
            message: `Successfully performed ${element} action`
          };

          ssePush?.({ tool: 'clickPokerElement', result });
          return result;
        },
      }),

      analyzePokerPosition: tool({
        description: 'Analyze current poker position and recommend strategy',
        inputSchema: z.object({
          position: z.string().describe('Current position: early, middle, late, button, small blind, big blind'),
          stackSize: z.optional(z.number()).describe('Current chip count'),
        }),
        execute: async ({ position, stackSize }) => {
          ssePush?.({ content: `🎯 Analyzing ${position} position strategy...` });
          
          // Poker position analysis logic
          const positionAdvice: Record<string, string> = {
            'early': 'Play tight - only premium hands like AA, KK, QQ, AK',
            'middle': 'Open up slightly - add pocket pairs and suited connectors',
            'late': 'Widen range significantly - steal opportunities available',
            'button': 'Most profitable position - can play wide range of hands',
            'small blind': 'Difficult position - play tight and consider 3-betting',
            'big blind': 'Already invested - defend with reasonable hands'
          };

          const advice = positionAdvice[position.toLowerCase()] || 'Standard position play recommended';
          
          const result = {
            position,
            stackSize,
            advice,
            recommendation: `From ${position}: ${advice}`
          };

          ssePush?.({ tool: 'analyzePokerPosition', result });
          return result;
        },
      }),
    },
    
    toolChoice: 'auto',
  });

  // Stream text with tool execution info
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
