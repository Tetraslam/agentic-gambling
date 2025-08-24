'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { Send, Zap, TrendingUp, TrendingDown, Flame, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getRandomMarkets, SimplifiedMarket } from '@/lib/apis/polymarket';
import React from 'react';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isOptimistic?: boolean;
  betAction?: any;
}

export default function PolymarketAgent() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [availableMarkets, setAvailableMarkets] = useState<SimplifiedMarket[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get reactive data from Convex
  const convexMessages = useQuery(api.polymarket.getMessages) || [];
  const activeBets = useQuery(api.polymarket.getActiveBets) || [];
  const tradeCount = useQuery(api.polymarket.getTradeCount) || 0;
  const settings = useQuery(api.userSettings.getSettings);
  const addMessage = useMutation(api.polymarket.addMessage);
  const clearAllMessages = useMutation(api.polymarket.clearAllMessages);
  const updateSettings = useMutation(api.userSettings.updateSettings);

  const balance = settings?.polymarketBalance || 10000;
  const unhingedMode = settings?.polymarketUnhingedMode ?? true;
  const demoMode = settings?.polymarketDemoMode ?? true;

  // Convert Convex messages and combine with local optimistic messages
  const messages = [
    ...convexMessages.map(msg => ({
      id: msg._id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
      betAction: msg.betAction
    })),
    ...localMessages
  ].sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp for proper order

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isThinking]);

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

  const handleClearChats = async () => {
    try {
      await clearAllMessages();
      setLocalMessages([]); // Also clear local optimistic messages
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

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
      isDemo: demoMode, // Properly track demo vs live bets
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

    // Auto-scroll after user message
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);

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

      if (!response.ok) throw new Error('API call failed');
      
      // Handle streaming response (same as trading agent)
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                // Auto-scroll as content streams
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
              }
              if (data.tool) {
                // Handle tool execution feedback
                console.log('Tool executed:', data.tool, data.result);
              }
            } catch (e) {
              // Ignore parse errors for streaming data
            }
          }
        }
      }

      // Add the complete AI response to the chat
      if (fullContent.trim()) {
        await addMessage({
          role: 'assistant',
          content: fullContent.trim(),
        });
      }

      // Final scroll after message is added
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Error calling Polymarket AI API:', error);
      
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

      // Auto-scroll after fallback message
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);

    } finally {
      setIsThinking(false);
      // Auto-focus input after response (like trading agent)
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - FIXED TOP */}
      <div className="flex-shrink-0 p-2 pb-0">
        {/* Agent Status */}
        <Card className="mb-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isThinking 
                    ? 'bg-yellow-500 animate-pulse' 
                    : unhingedMode 
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-green-500'
                }`} />
                {(isThinking || unhingedMode) && (
                  <span className="text-xs font-medium">
                    {isThinking ? 'Thinking...' : 'UNHINGED MODE'}
                  </span>
                )}
                {unhingedMode && <Flame className="w-3 h-3 text-red-500" />}
              </div>
              
              <div className="flex gap-1 items-center">
                <Badge variant="outline" className="text-xs">
                  ${balance.toLocaleString()}
                </Badge>
                <Badge variant={unhingedMode ? 'destructive' : 'default'} className="text-xs">
                  {tradeCount} trades
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {messages.length} msgs
                </Badge>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearChats}
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                    title="Clear chat history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Bets Preview */}
        {activeBets.length > 0 && (
          <Card className="mb-2">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">Recent Bets</span>
              </div>
              <div className="space-y-1">
                {activeBets.slice(-2).map((bet, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                    <span className="truncate mr-2">{bet.market.slice(0, 30)}...</span>
                    <div className="flex items-center gap-1">
                      {bet.position === 'yes' ? 
                        <TrendingUp className="w-2 h-2 text-green-600" /> : 
                        <TrendingDown className="w-2 h-2 text-red-600" />
                      }
                      <span>${bet.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Messages - SCROLLABLE ONLY */}
      <div className="flex-1 overflow-y-auto px-3 pb-2" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">🎲 I'm your polymarket agent!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {unhingedMode ? 
                  "I'll make TONS of trades! Chaos mode engaged! 🔥" : 
                  "I analyze prediction markets rationally."
                }
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/60 border'
                }`}>
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    
                    {/* Bet Action Display */}
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
              </div>
            ))
          )}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-muted/60 border rounded-lg px-3 py-2">
                <p className="text-sm text-muted-foreground animate-pulse">
                  {unhingedMode ? "Cooking up some chaos..." : "Analyzing markets..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input - COMPLETELY SEPARATE FIXED BOTTOM */}
      <div className="flex-shrink-0 border-t bg-background p-2">
        <div className="space-y-2">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={unhingedMode ? "Feed me market chaos! 🔥" : "Ask about prediction markets..."}
              disabled={isThinking}
              className="flex-1 text-sm h-9"
            />
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearChats}
                className="h-9 px-2 text-muted-foreground hover:text-destructive"
                title="Clear all messages"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <Button type="submit" disabled={!input.trim() || isThinking} size="sm" className="h-9 px-3">
              <Send className="w-3 h-3" />
            </Button>
          </form>
          
          {/* Unhinged Mode Warning */}
          {unhingedMode && (
            <div className="px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>UNHINGED MODE: I'll auto-trade randomly! Buckle up! 🎢</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
