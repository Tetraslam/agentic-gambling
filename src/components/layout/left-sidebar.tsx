'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const BRAINROT_VIDEOS = [
  'tya7H3aeiVk',
  'KBx_4lxmi2Y', 
  'rKWCDRzRcMc',
  'J---aiyznGQ',
  'u8QOeiGe6V0',
  'Ra5PFMWB988',
];

interface LeftSidebarProps {
  onToggleCollapse?: () => void;
}

export default function LeftSidebar({ onToggleCollapse }: LeftSidebarProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % BRAINROT_VIDEOS.length);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Create playlist string for continuous play
  const playlistString = BRAINROT_VIDEOS.join(',');

  return (
    <Card className="h-full rounded-none border-l-0 border-t-0 border-b-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">🧠 Brainrot Zone</CardTitle>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-6 w-6 p-0 hover:bg-muted/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {BRAINROT_VIDEOS.length} videos
          </Badge>
          <span className="text-xs text-muted-foreground">Auto-loop</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <iframe
            src={`https://www.youtube.com/embed/${BRAINROT_VIDEOS[currentVideoIndex]}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&playlist=${playlistString}`}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Brainrot Videos"
          />
        </div>
      </CardContent>
    </Card>
  );
}
