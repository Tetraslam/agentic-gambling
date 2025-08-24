'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef, useState } from 'react';
import { Send, Camera, Eye } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { captureIframeById } from "@/lib/utils/screenshot";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

export default function PokerAgent() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get reactive data from Convex
  const messages = useQuery(api.poker.getMessages) || [];
  const screenshots = useQuery(api.poker.getScreenshots) || [];
  const gameState = useQuery(api.poker.getGameState);
  const addMessage = useMutation(api.poker.addMessage);
  const updateGameState = useMutation(api.poker.updateGameState);

  // Merge Convex messages (DB) with streaming local message(s)
  const combinedMessages: Message[] = [
    ...messages.map((m: any) => ({
      id: m._id,
      role: m.role,
      content: m.content,
      toolInvocations: []
    })).reverse(),
    ...localMessages
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsAnalyzing(true);

    try {
      // Capture a real screenshot of the poker iframe for every message
      let screenshotDataUrl: string | null = null;
      try {
        screenshotDataUrl = await captureIframeById('poker_game', { preferCurrentTab: true, includeCursor: false });
      } catch (e) {
        console.warn('Screenshot capture failed; continuing without image', e);
      }

      // Persist user message (with screenshot if available) to Convex
      await addMessage({ role: 'user', content: userMessage, screenshot: screenshotDataUrl || undefined });

      // Compose all messages for the API
      const allMessages = [
        ...combinedMessages.map(m => ({ role: m.role, content: m.content })),
        screenshotDataUrl
          ? { role: 'user' as const, content: [
              { type: 'text', text: userMessage },
              { type: 'image', image: screenshotDataUrl }
            ] }
          : { role: 'user' as const, content: userMessage }
      ];

      const response = await fetch('/api/chat/poker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages })
      });

      if (!response.ok) throw new Error('Poker API call failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = { id: aiMessageId, role: 'assistant', content: '', toolInvocations: [] };
      setLocalMessages([aiMessage]);

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setLocalMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: fullContent } : m));
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
            if (data.tool) {
              // Inline render tool results
              setLocalMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, toolInvocations: [...(m.toolInvocations || []), { toolName: data.tool, result: data.result }] } : m));
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
          } catch {
            // ignore JSON parse issues for partial chunks
          }
        }
      }

      if (fullContent.trim()) {
        await addMessage({ role: 'assistant', content: fullContent.trim() });
        setLocalMessages([]);
      }
    } catch (err) {
      console.error('Poker agent error:', err);
      try {
        await addMessage({ role: 'assistant', content: `Error: ${String(err)}` });
      } catch {}
      setLocalMessages([]);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderedMessages = combinedMessages;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Agent Status */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">
                {isAnalyzing ? 'Analyzing screenshot...' : 'Watching game'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {screenshots.length}
              </Badge>
              <Badge variant={gameState?.isPlaying ? 'default' : 'secondary'}>
                {gameState?.isPlaying ? 'Playing' : 'Idle'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Screenshots Preview */}
      {screenshots.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Recent Screenshots</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {screenshots.slice(-3).map((screenshot, index) => (
                <img
                  key={index}
                  src={screenshot}
                  alt={`Screenshot ${index + 1}`}
                  className="w-16 h-12 object-cover rounded border flex-shrink-0"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages - streaming with auto-scroll */}
      <div className="flex-1 mb-4 overflow-y-auto px-1" ref={scrollRef}>
        <div className="space-y-4">
          {renderedMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>🎯 I'm your poker agent!</p>
              <p className="text-sm mt-1">Send me a message and I'll analyze your game via screenshot.</p>
            </div>
          )}
          
          {renderedMessages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {Array.isArray(message.toolInvocations) && message.toolInvocations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.toolInvocations.map((tool: any, index: number) => (
                      <div key={index} className="text-xs opacity-80 border-l-2 border-primary/30 pl-2 ml-1">
                        <div className="font-medium text-primary/90">⚡ {tool.toolName}</div>
                        {tool.result && (
                          <div className="mt-1 p-2 bg-background/60 rounded text-xs font-mono">
                            {typeof tool.result === 'object'
                              ? JSON.stringify(tool.result, null, 2)
                                  .split('\n')
                                  .slice(0, 3)
                                  .join('\n') + (JSON.stringify(tool.result).length > 100 ? '\n...' : '')
                              : String(tool.result)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask for advice, describe your hand, or just chat..."
          disabled={isAnalyzing}
          className="flex-1"
          ref={inputRef}
        />
        <Button onClick={handleSend} disabled={!input.trim() || isAnalyzing}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Game Stats */}
      {gameState?.chipCount && (
        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-center">
          💰 Chips: {gameState.chipCount.toLocaleString()} | Last: {gameState.lastAction}
        </div>
      )}
    </div>
  );
}
