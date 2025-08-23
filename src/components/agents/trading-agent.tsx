'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Send, TrendingUp } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function TradingAgent() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Get reactive data from Convex
  const messages = useQuery(api.trading.getMessages) || [];
  const messageCount = useQuery(api.trading.getMessageCount) || 0;
  const addMessage = useMutation(api.trading.addMessage);

  const shouldTrade = messageCount > 0 && messageCount % 5 === 0;

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
      const responses = [
        "Looking at the charts, I see some interesting patterns...",
        "Market sentiment seems bullish today. RSI is showing oversold conditions.",
        "The technicals are suggesting a potential breakout.",
        "Volume is picking up, might be time for a position.",
        "Fed minutes came out hawkish, adjusting strategy accordingly.",
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      let tradeAction = undefined;
      
      // Execute trade every 5th message
      if (shouldTrade) {
        const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'MSFT', 'GOOGL'];
        const actions = ['buy', 'sell'] as const;
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        
        tradeAction = {
          action,
          symbol,
          quantity,
          price: Math.random() * 500 + 50, // Random price
        };
      }

      await addMessage({
        role: 'assistant',
        content: shouldTrade 
          ? `${randomResponse} I'm executing a trade: ${tradeAction?.action.toUpperCase()} ${tradeAction?.quantity} shares of ${tradeAction?.symbol} at $${tradeAction?.price?.toFixed(2)}`
          : randomResponse,
        tradeAction,
      });

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
              <div className={`w-3 h-3 rounded-full ${isThinking ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">
                {isThinking ? 'Analyzing...' : 'Ready'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline">
                {messageCount} messages
              </Badge>
              {shouldTrade && (
                <Badge variant="destructive" className="animate-pulse">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trade Due!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>👋 Hey! I'm your trading agent.</p>
              <p className="text-sm mt-1">I'll execute a trade every 5 messages.</p>
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
                {message.tradeAction && (
                  <div className="mt-2 p-2 bg-background/20 rounded text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-semibold">TRADE EXECUTED</span>
                    </div>
                    <div className="mt-1">
                      {message.tradeAction.action.toUpperCase()} {message.tradeAction.quantity} {message.tradeAction.symbol} @ ${message.tradeAction.price?.toFixed(2)}
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
          placeholder="Ask about markets, strategies, or just chat..."
          disabled={isThinking}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isThinking}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Trade Counter Warning */}
      {messageCount > 0 && messageCount % 5 === 4 && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          ⚠️ Next message will trigger a trade!
        </div>
      )}
    </div>
  );
}
