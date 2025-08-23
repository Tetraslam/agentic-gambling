'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BRAINROT_VIDEOS = [
  'tya7H3aeiVk',
  'KBx_4lxmi2Y', 
  'rKWCDRzRcMc',
  'J---aiyznGQ',
  'u8QOeiGe6V0',
  'Ra5PFMWB988',
];

export default function LeftSidebar() {
  // Create playlist string for continuous play
  const playlistString = BRAINROT_VIDEOS.join(',');

  return (
    <Card className="h-full rounded-none border-l-0 border-t-0 border-b-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🧠 Brainrot Zone</CardTitle>
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
            src={`https://www.youtube.com/embed/${BRAINROT_VIDEOS[0]}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&playlist=${playlistString}`}
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
