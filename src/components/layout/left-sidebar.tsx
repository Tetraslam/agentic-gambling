'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

const BRAINROT_VIDEOS = [
  'https://www.youtube.com/embed/hFZFjoX2cGg',
  'https://www.youtube.com/embed/x8Xa0cdVbew', 
  'https://www.youtube.com/embed/Tn5ywPFetAY',
  'https://www.youtube.com/embed/qEVUtrk8_B4',
];

export default function LeftSidebar() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % BRAINROT_VIDEOS.length);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full rounded-none border-l-0 border-t-0 border-b-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🧠 Brainrot Zone</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {currentVideoIndex + 1}/{BRAINROT_VIDEOS.length}
          </Badge>
          <span className="text-xs text-muted-foreground">Peak performance</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 flex-1">
        <div className="aspect-video">
          <iframe
            src={`${BRAINROT_VIDEOS[currentVideoIndex]}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0`}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`Brainrot Video ${currentVideoIndex + 1}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
