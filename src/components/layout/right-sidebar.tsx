'use client';

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
  },
  credits: {
    title: '💰 Platform Stats',
    description: 'House always wins',
    badge: 'Casino'
  }
} as const;

interface RightSidebarProps {
  activeTab: string;
}

export default function RightSidebar({ activeTab }: RightSidebarProps) {
  const config = AGENT_CONFIG[activeTab as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.trading;

  return (
    <div className="h-full flex flex-col border-l">
      <div className="flex-shrink-0 p-4 pb-2 border-b bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{config.title}</h3>
          <Badge variant="outline" className="text-xs">
            {config.badge}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
      
      <div className="flex-1 min-h-0">
        {activeTab === 'trading' && <TradingAgent />}
        {activeTab === 'poker' && <PokerAgent />}
        {activeTab === 'polymarket' && <PolymarketAgent />}
        {activeTab === 'credits' && (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🎰</div>
              <h3 className="text-sm font-medium">Casino Mode Activated</h3>
              <p className="text-xs text-muted-foreground">
                We take 80% because math is hard
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Platform Cut:</span>
                <span className="font-medium">80%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Your Cut:</span>
                <span className="font-medium text-green-600">20%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>House Edge:</span>
                <span className="font-medium text-red-600">Always</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                💡 Pro Tip: The house always wins, but at least you get to watch pretty charts!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
