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

export default function PolymarketAgent() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Get reactive data from Convex
  const messages = useQuery(api.polymarket.getMessages) || [];
  const activeBets = useQuery(api.polymarket.getActiveBets) || [];
  const tradeCount = useQuery(api.polymarket.getTradeCount) || 0;
  const settings = useQuery(api.userSettings.getSettings);
  const addMessage = useMutation(api.polymarket.addMessage);
  const updateSettings = useMutation(api.userSettings.updateSettings);

  const balance = settings?.polymarketBalance || 10000;
  const unhingedMode = settings?.polymarketUnhingedMode ?? true;
  
  // Auto-trade when unhinged (random intervals)
  useEffect(() => {
    if (!unhingedMode) return;
    
    const randomInterval = Math.random() * 30000 + 10000; // 10-40 seconds
    const timeout = setTimeout(() => {
      if (Math.random() > 0.3) { // 70% chance to auto-trade
        executeRandomTrade();
      }
    }, randomInterval);

    return () => clearTimeout(timeout);
  }, [messages, unhingedMode]);

  const executeRandomTrade = async () => {
    const markets = [
      "Will Bitcoin hit $100k by end of 2024?",
      "Will AI replace 50% of jobs by 2030?",
      "Will there be a recession in 2024?",
      "Will Elon buy Twitter again?",
      "Will Trump run for president in 2024?",
      "Will we find aliens in 2024?",
      "Will ChatGPT pass the Turing test?",
      "Will TikTok get banned in the US?",
    ];

    const market = markets[Math.floor(Math.random() * markets.length)];
    const position = Math.random() > 0.5 ? 'yes' : 'no';
    const amount = Math.floor(Math.random() * 500) + 50;
    
    const betAction = {
      market,
      position: position as 'yes' | 'no',
      amount,
      odds: Math.random() * 0.8 + 0.1,
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
      content: `${response} Placed ${amount} on ${position.toUpperCase()} for "${market}"`,
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

    // Simulate agent thinking
    setTimeout(async () => {
      const normalResponses = [
        "Interesting market dynamics here. Let me analyze the probability curves...",
        "The prediction markets are showing some unusual activity lately.",
        "I'm seeing some arbitrage opportunities across different platforms.",
        "Market sentiment seems to be shifting based on recent events.",
        "The liquidity in this market is quite thin, interesting...",
      ];

      const unhingedResponses = [
        "🚀 BRO, this market is SCREAMING at me! Time to make some MOVES!",
        "💀 Either we're going to the moon or losing it all! No middle ground!",
        "🔥 My prediction spidey-senses are TINGLING! Time for some chaos!",
        "⚡ LIGHTNING ROUND! Let me place like 5 trades real quick!",
        "🎰 Vegas mode activated! Let's make this interesting!",
        "💎 Diamond hands on these predictions! HODL the chaos!",
        "🌙 When in doubt, bet on the most absurd outcome!",
        "🎯 My gut > your research! Fight me!",
      ];

      const responses = unhingedMode ? unhingedResponses : normalResponses;
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      // Maybe execute a trade based on user message
      if (unhingedMode && Math.random() > 0.4) {
        await executeRandomTrade();
      } else {
        await addMessage({
          role: 'assistant',
          content: response,
        });
      }

      setIsThinking(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
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
        <div className="space-y-4">
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
