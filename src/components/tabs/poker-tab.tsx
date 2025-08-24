'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { captureIframeById } from "@/lib/utils/screenshot";
import { useEffect, useMemo, useRef, useState } from 'react';

export default function PokerTab() {
  // Get reactive data from Convex
  const gameState = useQuery(api.poker.getGameState);
  const screenshots = useQuery(api.poker.getScreenshots) || [];
  const addMessage = useMutation(api.poker.addMessage);

  const takeScreenshot = async () => {
    try {
      // Real screenshot of the poker iframe using Display Media capture
      const dataUrl = await captureIframeById('poker_game', {
        preferCurrentTab: true,
        includeCursor: false,
      });

      await addMessage({
        role: 'user',
        content: 'Manual screenshot taken',
        screenshot: dataUrl,
      });
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <br></br>
      {/* Poker Game Area - HUGE */}
      <div className="h-[85vh] mb-2">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 py-2">
            <CardTitle className="text-sm">Poker Game</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={gameState?.isPlaying ? 'default' : 'secondary'} className="text-xs">
                {gameState?.isPlaying ? 'Playing' : 'Waiting'}
              </Badge>
              <Button size="sm" onClick={takeScreenshot} className="h-6 px-2">
                <Camera className="w-3 h-3 mr-1" />
                Screenshot
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <div className="relative w-full h-full">
              {/* Live Poker Game */}
              <iframe 
                src="https://html-classic.itch.zone/html/5693412/index.html" 
                className="w-full h-full border-0 bg-transparent rounded-b-lg" 
                allowFullScreen={true}
                allow="autoplay; fullscreen *; geolocation; microphone; camera; midi; monetization; xr-spatial-tracking; gamepad; gyroscope; accelerometer; xr; cross-origin-isolated; web-share"
                id="poker_game"
                scrolling="no"
                title="Online Poker Game"
              />

              {/* Click overlay guided by latest action */}
              <ClickOverlay action={gameState?.lastAction} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Stats - TINY */}
      <div className="h-[calc(15vh-2rem)] grid grid-cols-3 gap-2">
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

function ClickOverlay({ action }: { action?: string }) {
  const [visible, setVisible] = useState(false);
  const prevActionRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!action) return;
    if (prevActionRef.current !== action) {
      prevActionRef.current = action;
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [action]);

  const pos = useMemo(() => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('fold')) return { x: 15, y: 85, label: 'Fold' };
    if (lower.includes('call')) return { x: 50, y: 85, label: 'Call' };
    if (lower.includes('check')) return { x: 50, y: 85, label: 'Check' };
    if (lower.includes('raise')) return { x: 85, y: 85, label: 'Raise' };
    if (lower.includes('bet')) return { x: 85, y: 85, label: 'Bet' };
    return null;
  }, [action]);

  if (!visible || !pos) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      
    </div>
  );
}
