'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Send, Camera, Eye } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function PokerAgent() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get reactive data from Convex
  const messages = useQuery(api.poker.getMessages) || [];
  const screenshots = useQuery(api.poker.getScreenshots) || [];
  const gameState = useQuery(api.poker.getGameState);
  const addMessage = useMutation(api.poker.addMessage);
  const updateGameState = useMutation(api.poker.updateGameState);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Simulate taking a screenshot when user sends a message
    const fakeScreenshot = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23065f46"/><circle cx="200" cy="150" r="50" fill="%23ffffff" opacity="0.1"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" fill="%23ffffff" font-size="14">Screenshot ${screenshots.length + 1}</text><text x="50%" y="70%" text-anchor="middle" dy=".3em" font-family="Arial" fill="%23a7f3d0" font-size="12">${new Date().toLocaleTimeString()}</text></svg>`;
    
    // Add user message
    await addMessage({
      role: 'user',
      content: userMessage,
      screenshot: fakeScreenshot,
    });

    setIsAnalyzing(true);

    // Simulate agent analyzing the screenshot
    setTimeout(async () => {
      const responses = [
        "I can see you're holding pocket aces! This is a strong hand, I'd recommend raising.",
        "Your position looks good. The flop seems favorable - consider a continuation bet.",
        "I notice the opponent is showing weakness. This might be a good spot to bluff.",
        "The board is quite coordinated. Be careful of potential draws.",
        "Your stack size suggests we should play more conservatively here.",
        "I see a potential flush draw on the board. Adjust your bet sizing accordingly.",
        "The opponent's betting pattern suggests they have a made hand. Consider folding.",
        "This is a good spot for a check-call. Let them build the pot for us.",
      ];

      const pokerAdvice = responses[Math.floor(Math.random() * responses.length)];
      
      // Update game state randomly
      const actions = ['fold', 'call', 'raise', 'check', 'bet'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      await updateGameState({
        isPlaying: true,
        lastAction: randomAction,
        chipCount: Math.floor(Math.random() * 5000) + 1000,
      });

      await addMessage({
        role: 'assistant',
        content: `📸 Screenshot analyzed! ${pokerAdvice}`,
      });

      setIsAnalyzing(false);
    }, 1500 + Math.random() * 2000);
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

      {/* Messages */}
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>🎯 I'm your poker agent!</p>
              <p className="text-sm mt-1">Send me a message and I'll analyze your game via screenshot.</p>
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
                {message.screenshot && message.role === 'user' && (
                  <div className="mt-2">
                    <img
                      src={message.screenshot}
                      alt="Screenshot"
                      className="w-full max-w-32 h-24 object-cover rounded border"
                    />
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
          placeholder="Ask for advice, describe your hand, or just chat..."
          disabled={isAnalyzing}
          className="flex-1"
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
