'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTradingStore } from '@/lib/stores/trading-store';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from 'react';

interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price?: string;
  unrealized_pl: string;
  market_value: string;
}

interface AlpacaAccount {
  cash: string;
  portfolio_value: string;
  buying_power: string;
}

export default function TradingTab() {
  const { watchlist } = useTradingStore();
  const [portfolio, setPortfolio] = useState<AlpacaPosition[]>([]);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Load real Alpaca portfolio
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        
        // Load account info
        const accountResponse = await fetch('/api/alpaca/account');
        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          setAccount(accountData);
        }
        
        // Load positions
        const positionsResponse = await fetch('/api/alpaca/positions');
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          setPortfolio(positionsData);
        }
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate total portfolio value
  const totalValue = account && account.portfolio_value ? 
    (isNaN(parseFloat(account.portfolio_value)) ? 0 : parseFloat(account.portfolio_value)) : 0;

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex gap-2 flex-1">
        {/* Chart - Larger */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Market Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2">
            <div className="h-[400px] bg-muted/20 rounded">
              <iframe
                src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d87&symbol=NASDAQ:AAPL&interval=D&hidesidetoolbar=1&saveimage=0&toolbarbg=f1f3f6&trendlines=0&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&hideideas=1&hidevolume=1&withdateranges=1&scaleposition=no&details=1&calendar=0&hotlist=1"
                className="w-full h-full rounded"
                title="TradingView Chart"
              />
            </div>
          </CardContent>
        </Card>

        {/* Portfolio & Watchlist */}
        <div className="w-80 space-y-2">
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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      ${totalValue.toFixed(0)}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const [accountRes, positionsRes] = await Promise.all([
                            fetch('/api/alpaca/account'),
                            fetch('/api/alpaca/positions')
                          ]);
                          
                          if (accountRes.ok) {
                            const accountData = await accountRes.json();
                            setAccount(accountData);
                          }
                          
                          if (positionsRes.ok) {
                            const positionsData = await positionsRes.json();
                            setPortfolio(positionsData);
                          }
                        } catch (error) {
                          console.error('Error refreshing portfolio:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="h-6 px-2"
                    >
                      {loading ? '⟳' : '🔄'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {/* Account Info */}
                {account && (
                  <div className="border rounded p-2 bg-muted/20">
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Cash:</span>
                        <span className="ml-1 font-medium">
                          ${isNaN(parseFloat(account.cash)) ? '0' : parseFloat(account.cash).toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Buying Power:</span>
                        <span className="ml-1 font-medium">
                          ${isNaN(parseFloat(account.buying_power)) ? '0' : parseFloat(account.buying_power).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Positions */}
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Loading positions...</p>
                  </div>
                ) : portfolio.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                      No positions yet<br/>
                      <span className="text-xs">💬 Chat with the agent to start trading!</span>
                    </p>
                  </div>
                ) : (
                  portfolio.map((position, index) => {
                    const unrealizedPL = parseFloat(position.unrealized_pl || '0');
                    const marketValue = parseFloat(position.market_value || '0');
                    const avgPrice = parseFloat(position.avg_entry_price || '0');
                    const quantity = parseFloat(position.qty || '0');
                    const isProfit = unrealizedPL > 0;
                    
                    return (
                      <div key={index} className="p-2 border rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{position.symbol}</span>
                          <Badge variant={isProfit ? "default" : "destructive"} className="text-xs">
                            {isNaN(unrealizedPL) ? '--' : `$${unrealizedPL.toFixed(2)}`}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {quantity} shares @ ${isNaN(avgPrice) ? '--' : avgPrice.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">
                          Value: ${isNaN(marketValue) ? '--' : marketValue.toFixed(2)}
                        </div>
                      </div>
                    );
                  })
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
      </div>

      {/* Trading Instructions - Compact */}
      <Card className="h-auto">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-blue-500">🤖</span>
                <span>Chat with AI Agent in sidebar</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-500">⚡</span>
                <span>Auto-trade every 5th message</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">💰</span>
                <span>Real paper trading via Alpaca</span>
              </div>
            </div>
            <div className="text-muted-foreground">
              Try: "What's AAPL looking like?" • "Should I buy TSLA?"
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
