'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChat } from 'ai/react';
import { TrendingUp, Send } from 'lucide-react';

export default function TradingAgent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/trading',
  });

  // Calculate messages until trade (every 5 messages)
  const messagesUntilTrade = 5 - (messages.length % 5);
  const willTriggerTrade = messagesUntilTrade === 1;

  return (
    <div className="flex flex-col h-full p-2">
      {/* Header */}
      <Card className="mb-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-xs font-medium">
                {isLoading ? 'Trading...' : 'Ready'}
              </span>
            </div>
            
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                {messages.length} msgs
              </Badge>
              {willTriggerTrade && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  <TrendingUp className="w-2 h-2 mr-1" />
                  Trade Ready!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <ScrollArea className="flex-1 mb-2">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-xs">👋 I'm your trading agent!</p>
              <p className="text-xs text-muted-foreground mt-1">
                I'll execute real trades every 5 messages
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[85%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <CardContent className="p-2">
                    <p className="text-xs leading-relaxed">{message.content}</p>
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        {message.toolInvocations.map((tool, idx) => (
                          <div key={idx} className="text-xs opacity-75 mb-1">
                            <span className="font-medium">🔧 {tool.toolName}:</span>
                            {tool.result && (
                              <div className="mt-1 p-1 bg-background/20 rounded text-xs">
                                {typeof tool.result === 'object' ? JSON.stringify(tool.result, null, 2) : tool.result}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-muted">
                <CardContent className="p-2">
                  <p className="text-xs text-muted-foreground">Agent analyzing markets...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about markets..."
            disabled={isLoading}
            className="flex-1 text-xs h-8"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="sm" className="h-8 px-3">
            <Send className="w-3 h-3" />
          </Button>
        </form>
        
        {/* Trade Warning */}
        {willTriggerTrade && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            ⚠️ Next message triggers a trade!
          </div>
        )}
      </div>
    </div>
  );
}
