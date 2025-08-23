'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { Send, Zap, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getRandomMarkets, SimplifiedMarket } from '@/lib/apis/polymarket';

export default function PolymarketAgent() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [availableMarkets, setAvailableMarkets] = useState<SimplifiedMarket[]>([]);

  // Get reactive data from Convex
  const messages = useQuery(api.polymarket.getMessages) || [];
  const activeBets = useQuery(api.polymarket.getActiveBets) || [];
  const tradeCount = useQuery(api.polymarket.getTradeCount) || 0;
  const settings = useQuery(api.userSettings.getSettings);
  const addMessage = useMutation(api.polymarket.addMessage);
  const updateSettings = useMutation(api.userSettings.updateSettings);

  const balance = settings?.polymarketBalance || 10000;
  const unhingedMode = settings?.polymarketUnhingedMode ?? true;
  const demoMode = settings?.polymarketDemoMode ?? true;

  // Load markets for trading
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const markets = await getRandomMarkets(20);
        setAvailableMarkets(markets);
      } catch (error) {
        console.error('Failed to load markets for agent:', error);
        // Fallback to demo markets
        setAvailableMarkets([
          {
            id: 'demo-1',
            question: "Will Bitcoin hit $100k by end of 2024?",
            yesPrice: 0.73,
            noPrice: 0.27,
            volume: "$2.1M",
            category: "Crypto",
            endDate: "2024-12-31T23:59:59Z",
            description: "Demo market",
            slug: "bitcoin-100k-2024",
            closed: false
          }
        ]);
      }
    };
    loadMarkets();
  }, []);
  
  // Auto-trade when unhinged (random intervals)
  useEffect(() => {
    if (!unhingedMode || availableMarkets.length === 0) return;
    
    const randomInterval = Math.random() * 30000 + 10000; // 10-40 seconds
    const timeout = setTimeout(() => {
      if (Math.random() > 0.3) { // 70% chance to auto-trade
        executeRandomTrade();
      }
    }, randomInterval);

    return () => clearTimeout(timeout);
  }, [messages, unhingedMode, availableMarkets]);

  const executeRandomTrade = async () => {
    // Use real markets if available, otherwise fallback to demo data
    if (availableMarkets.length === 0) {
      console.log('No markets available for trading yet');
      return;
    }

    const market = availableMarkets[Math.floor(Math.random() * availableMarkets.length)];
    const position = Math.random() > 0.5 ? 'yes' : 'no';
    const amount = Math.floor(Math.random() * 500) + 50;
    
    // Use actual market prices for more realistic demo
    const odds = position === 'yes' ? market.yesPrice : market.noPrice;
    
    const betAction = {
      market: market.question,
      position: position as 'yes' | 'no',
      amount,
      odds,
    };

    const unhingedResponses = [
      "🚀 YOLO! Just went all in on this one!",
      "💎 My gut says this is the play! Diamond hands!",
      "🔥 This market is screaming at me! Had to take the bet!",
      "⚡ Lightning fast decision! No second thoughts!",
      "🎰 Feeling lucky today! Let's see what happens!",
      "🌙 To the moon with this prediction!",
      "💀 Either I'm genius or completely insane!",
      "🎯 My algorithms (vibes) are telling me this is IT!",
    ];

    const response = unhingedResponses[Math.floor(Math.random() * unhingedResponses.length)];

    await addMessage({
      role: 'assistant',
      content: `${response} Placed $${amount} on ${position.toUpperCase()} for "${market.question}" (${market.category} market, ${market.volume} volume)`,
      betAction,
    });

    // Update balance
    await updateSettings({
      polymarketBalance: balance - amount,
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    await addMessage({
      role: 'user',
      content: userMessage,
    });

    setIsThinking(true);

    // Call the AI-powered Polymarket API
    try {
      const response = await fetch('/api/chat/polymarket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: userMessage }
          ],
          demoMode: demoMode, // Use current setting
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Extract the content from the AI SDK format
            try {
              const content = line.slice(2);
              aiResponse += content;
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Add the AI response to the chat
      if (aiResponse.trim()) {
        await addMessage({
          role: 'assistant',
          content: aiResponse.trim(),
        });
      }

    } catch (error) {
      console.error('Error calling AI API:', error);
      
      // Fallback to simple response if AI fails
      const fallbackResponses = [
        "🤖 My AI brain is having a moment... but I'm still bullish on this market!",
        "⚡ Technical difficulties, but my prediction instincts are still firing!",
        "🔄 Rebooting my market analysis algorithms... give me a sec!",
      ];
      
      await addMessage({
        role: 'assistant',
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Agent Status */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isThinking 
                  ? 'bg-yellow-500 animate-pulse' 
                  : unhingedMode 
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium">
                {isThinking ? 'Thinking...' : unhingedMode ? 'UNHINGED MODE' : 'Rational mode'}
              </span>
              {unhingedMode && <Flame className="w-4 h-4 text-red-500" />}
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline">
                ${balance.toLocaleString()}
              </Badge>
              <Badge variant={unhingedMode ? 'destructive' : 'default'}>
                {tradeCount} trades
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Bets Preview */}
      {activeBets.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Recent Bets</span>
            </div>
            <div className="space-y-1">
              {activeBets.slice(-2).map((bet, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                  <span className="truncate mr-2">{bet.market.slice(0, 30)}...</span>
                  <div className="flex items-center gap-1">
                    {bet.position === 'yes' ? 
                      <TrendingUp className="w-3 h-3 text-green-600" /> : 
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    }
                    <span>${bet.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4 p-2">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>🎲 I'm your polymarket agent!</p>
              <p className="text-sm mt-1">
                {unhingedMode ? 
                  "I'll make TONS of trades! Chaos mode engaged! 🔥" : 
                  "I analyze prediction markets rationally."
                }
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.betAction && (
                  <div className="mt-2 p-2 bg-background/20 rounded text-xs">
                    <div className="flex items-center gap-1">
                      {message.betAction.position === 'yes' ? 
                        <TrendingUp className="w-3 h-3 text-green-400" /> : 
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      }
                      <span className="font-semibold">BET PLACED</span>
                    </div>
                    <div className="mt-1">
                      ${message.betAction.amount} on {message.betAction.position.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={unhingedMode ? "Feed me market chaos! 🔥" : "Ask about prediction markets..."}
          disabled={isThinking}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isThinking}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Unhinged Mode Warning */}
      {unhingedMode && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>UNHINGED MODE: I'll auto-trade randomly! Buckle up! 🎢</span>
        </div>
      )}
    </div>
  );
}
