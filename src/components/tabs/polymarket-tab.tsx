'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function PolymarketTab() {
  // Get reactive data from Convex
  const activeBets = useQuery(api.polymarket.getActiveBets) || [];
  const tradeCount = useQuery(api.polymarket.getTradeCount) || 0;
  const settings = useQuery(api.userSettings.getSettings);
  const updateSettings = useMutation(api.userSettings.updateSettings);

  const balance = settings?.polymarketBalance || 10000;
  const unhingedMode = settings?.polymarketUnhingedMode ?? true;

  const toggleUnhingedMode = () => {
    updateSettings({ polymarketUnhingedMode: !unhingedMode });
  };

  // Mock prediction markets
  const markets = [
    {
      question: "Will Bitcoin hit $100k by end of 2024?",
      yesPrice: 0.73,
      noPrice: 0.27,
      volume: "$2.1M",
      category: "Crypto"
    },
    {
      question: "Will AI replace 50% of jobs by 2030?",
      yesPrice: 0.42,
      noPrice: 0.58,
      volume: "$890K",
      category: "Tech"
    },
    {
      question: "Will there be a recession in 2024?",
      yesPrice: 0.35,
      noPrice: 0.65,
      volume: "$1.5M",
      category: "Economy"
    },
    {
      question: "Will Elon buy Twitter again?",
      yesPrice: 0.08,
      noPrice: 0.92,
      volume: "$420K",
      category: "Memes"
    }
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header with Balance & Unhinged Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Balance:</span>
              <Badge variant="secondary" className="text-lg">
                ${balance.toLocaleString()}
              </Badge>
            </div>
          </Card>
          
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Trades:</span>
              <Badge variant="outline">{tradeCount}</Badge>
            </div>
          </Card>
        </div>

        <Button 
          variant={unhingedMode ? "destructive" : "outline"}
          onClick={toggleUnhingedMode}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {unhingedMode ? 'UNHINGED' : 'Rational'}
        </Button>
      </div>

      {/* Markets Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-auto">
        {markets.map((market, index) => (
          <Card key={index} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm leading-tight">
                  {market.question}
                </CardTitle>
                <Badge variant="outline" className="ml-2">
                  {market.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Yes/No Prices */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 hover:bg-green-50 hover:border-green-300"
                  >
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">YES</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {(market.yesPrice * 100).toFixed(0)}¢
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 hover:bg-red-50 hover:border-red-300"
                  >
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="font-semibold">NO</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">
                      {(market.noPrice * 100).toFixed(0)}¢
                    </span>
                  </Button>
                </div>

                {/* Volume */}
                <div className="text-center text-sm text-muted-foreground">
                  Volume: {market.volume}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Bets */}
      {activeBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeBets.map((bet) => (
                <div key={bet._id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{bet.market}</p>
                    <p className="text-xs text-muted-foreground">
                      {bet.position.toUpperCase()} - ${bet.amount}
                    </p>
                  </div>
                  <Badge variant={bet.position === 'yes' ? 'default' : 'destructive'}>
                    {bet.position.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
