'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function PokerTab() {
  // Get reactive data from Convex
  const gameState = useQuery(api.poker.getGameState);
  const screenshots = useQuery(api.poker.getScreenshots) || [];
  const addMessage = useMutation(api.poker.addMessage);

  const takeScreenshot = async () => {
    try {
      // For now, we'll simulate a screenshot
      // In a real implementation, you'd use screen capture APIs
      const fakeScreenshot = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" fill="%236b7280">Poker Screenshot ${screenshots.length + 1}</text></svg>`;
      
      // Add a message with the screenshot
      await addMessage({
        role: 'user',
        content: 'Manual screenshot taken',
        screenshot: fakeScreenshot,
      });
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Poker Game Area */}
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Poker Game</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={gameState?.isPlaying ? 'default' : 'secondary'}>
              {gameState?.isPlaying ? 'Playing' : 'Waiting'}
            </Badge>
            <Button size="sm" onClick={takeScreenshot}>
              <Camera className="w-4 h-4 mr-1" />
              Screenshot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-full">
          {/* Poker iframe would go here */}
          <div className="w-full h-full bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.3)_100%)]" />
            <div className="text-center z-10">
              <div className="text-4xl mb-4">🃏</div>
              <p className="text-white text-lg font-semibold mb-2">Online Poker</p>
              <p className="text-green-200 text-sm">
                Iframe integration coming soon...
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <div className="w-12 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-2xl">
                  🂡
                </div>
                <div className="w-12 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-2xl">
                  🂮
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{gameState?.chipCount || 1000}</p>
              <p className="text-sm text-muted-foreground">Chips</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{screenshots.length}</p>
              <p className="text-sm text-muted-foreground">Screenshots</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{gameState?.lastAction || 'None'}</p>
              <p className="text-sm text-muted-foreground">Last Action</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
