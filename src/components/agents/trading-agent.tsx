'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

export default function TradingAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call the actual API route
      const response = await fetch('/api/chat/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!response.ok) throw new Error('API call failed');
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        toolInvocations: []
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
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
                setMessages(prev => prev.map(m => 
                  m.id === aiMessage.id ? { ...m, content: fullContent } : m
                ));
                // autoscroll as content streams
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
              }
              if (data.tool) {
                // optional: render tool outputs inline
                setMessages(prev => prev.map(m => 
                  m.id === aiMessage.id 
                    ? { ...m, toolInvocations: [...(m.toolInvocations || []), { toolName: data.tool, result: data.result }] }
                    : m
                ));
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
              }
            } catch (e) {
              // Ignore parse errors for streaming data
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Trading agent error:', error);
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: `🔧 Trading API connected! Error: ${error}. Check your API keys in .env.local` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Auto-focus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Calculate messages until trade (every 5 messages)
  const messagesUntilTrade = 5 - (messages.length % 5);
  const willTriggerTrade = messagesUntilTrade === 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-2 pb-0">
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
      </div>

      {/* Messages - SCROLLABLE ONLY */}
      <div className="flex-1 overflow-y-auto px-3 pb-2" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Ready to trade!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask me about markets or just say hi
              </p>
            </div>
          ) : (
            messages.map((message: Message) => (
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
                    
                    {/* Inline tool calls */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.toolInvocations.map((tool: any, idx: number) => (
                          <div key={idx} className="text-xs opacity-80 border-l-2 border-primary/30 pl-2 ml-1">
                            <div className="font-medium text-primary/90">⚡ {tool.toolName}</div>
                            {tool.result && (
                              <div className="mt-1 p-2 bg-background/60 rounded text-xs font-mono">
                                {typeof tool.result === 'object' 
                                  ? JSON.stringify(tool.result, null, 2)
                                    .split('\n')
                                    .slice(0, 3)
                                    .join('\n') + (JSON.stringify(tool.result).length > 100 ? '\n...' : '')
                                  : tool.result}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/60 border rounded-lg px-3 py-2">
                <p className="text-sm text-muted-foreground animate-pulse">Analyzing markets...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input - COMPLETELY SEPARATE FIXED BOTTOM */}
      <div className="flex-shrink-0 border-t bg-background p-2">
        <div className="space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about markets..."
            disabled={isLoading}
            className="flex-1 text-sm h-9"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="sm" className="h-9 px-3">
            <Send className="w-3 h-3" />
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}
