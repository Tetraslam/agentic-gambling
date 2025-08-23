'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TradingAgent from '../agents/trading-agent';
import PokerAgent from '../agents/poker-agent';
import PolymarketAgent from '../agents/polymarket-agent';

const AGENT_CONFIG = {
  trading: {
    title: '📊 Trading Agent',
    description: 'Executes trades every 5 messages',
    badge: 'Active'
  },
  poker: {
    title: '🎯 Poker Agent', 
    description: 'Screenshot analysis & advice',
    badge: 'Watching'
  },
  polymarket: {
    title: '🎰 Polymarket Agent',
    description: 'Unhinged prediction trading',
    badge: 'Chaos'
  }
} as const;

interface RightSidebarProps {
  activeTab: string;
}

export default function RightSidebar({ activeTab }: RightSidebarProps) {
  const config = AGENT_CONFIG[activeTab as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.trading;

  return (
    <Card className="h-full rounded-none border-r-0 border-t-0 border-b-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {config.badge}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        {activeTab === 'trading' && <TradingAgent />}
        {activeTab === 'poker' && <PokerAgent />}
        {activeTab === 'polymarket' && <PolymarketAgent />}
      </CardContent>
    </Card>
  );
}
