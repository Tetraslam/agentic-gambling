'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTradingStore } from '@/lib/stores/trading-store';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function TradingTab() {
  const { watchlist } = useTradingStore();
  const portfolio = useQuery(api.trading.getPortfolio) || [];

  // Calculate total portfolio value
  const totalValue = portfolio.reduce((sum, position) => 
    sum + (position.quantity * position.avgPrice), 0
  );

  return (
    <div className="h-full grid grid-cols-3 gap-2">
      {/* Chart */}
      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-2">
          <div className="h-full bg-muted/20 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="font-medium">TradingView Chart</p>
              <p className="text-xs text-muted-foreground">Integration coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio & Watchlist */}
      <div className="space-y-2">
        <Tabs defaultValue="portfolio" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
            <TabsTrigger value="watchlist" className="text-xs">Watchlist</TabsTrigger>
          </TabsList>
          
          <TabsContent value="portfolio" className="mt-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Portfolio</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    ${totalValue.toFixed(0)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {portfolio.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">No positions yet</p>
                  </div>
                ) : (
                  portfolio.map((position) => (
                    <div key={position._id} className="p-1 border rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{position.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {((Math.random() * 10 - 5)).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        {position.quantity} @ ${position.avgPrice.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="watchlist" className="mt-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Watchlist</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {watchlist.map((symbol, index) => (
                  <div key={index} className="flex items-center justify-between p-1 border rounded text-xs">
                    <span className="font-medium">{symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {(Math.random() * 5 - 2.5).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* News Feed */}
      <Card className="col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Market News</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 border rounded">
              <p className="font-medium">📈 Markets surge on AI optimism</p>
              <p className="text-muted-foreground">2 min ago</p>
            </div>
            <div className="p-2 border rounded">
              <p className="font-medium">🚨 Fed hints at rate cuts</p>
              <p className="text-muted-foreground">15 min ago</p>
            </div>
            <div className="p-2 border rounded">
              <p className="font-medium">💰 Tech earnings beat expectations</p>
              <p className="text-muted-foreground">1 hr ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
