'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTradingStore } from '@/lib/stores/trading-store';
import { useQuery, useMutation } from "convex/react";
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
  const { watchlist, currentSymbol } = useTradingStore();
  const [portfolio, setPortfolio] = useState<AlpacaPosition[]>([]);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [portfolioPL, setPortfolioPL] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get portfolio data from Convex (tracks our agent's trades)
  const convexPortfolio = useQuery(api.trading.getPortfolio) || [];
  const convexMessages = useQuery(api.trading.getMessages) || [];
  const updatePortfolioPL = useMutation(api.trading.updatePortfolioPL);

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

        // Load pending orders
        const pendingResponse = await fetch('/api/alpaca/pending-orders');
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingOrders(pendingData);
        }

        // Load and store P&L data
        const plResponse = await fetch('/api/alpaca/portfolio-pl');
        if (plResponse.ok) {
          const plData = await plResponse.json();
          setPortfolioPL(plData);
          
          // Store P&L in Convex for credits calculation
          try {
            await updatePortfolioPL(plData);
          } catch (convexError) {
            console.error('Failed to update Convex P&L:', convexError);
          }
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
  }, [updatePortfolioPL]);

  // Calculate total portfolio value
  const totalValue = account && account.portfolio_value ? 
    (isNaN(parseFloat(account.portfolio_value)) ? 0 : parseFloat(account.portfolio_value)) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Top Section - Chart (60% of screen height) */}
      <div className="h-[60vh] min-h-0 mb-2">
        <div className="h-full bg-card border rounded-xl p-2">
          <div className="pb-2">
            <h3 className="text-sm font-semibold">Market Overview</h3>
          </div>
          <div className="h-full bg-muted/20 rounded">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d87&symbol=NASDAQ:${currentSymbol}&interval=D&hidesidetoolbar=1&saveimage=0&toolbarbg=f1f3f6&trendlines=0&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&hideideas=1&hidevolume=1&withdateranges=1&scaleposition=no&details=1&calendar=0&hotlist=1`}
              className="w-full h-full rounded"
              title={`TradingView Chart - ${currentSymbol}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Portfolio (takes remaining space) */}
      <div className="flex-1 min-h-0 flex gap-2">
        <Tabs defaultValue="portfolio" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-2 flex-shrink-0">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="pending">Pending Orders</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>
        
        <TabsContent value="portfolio" className="mt-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl p-2">
            <div className="pb-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Portfolio</h3>
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
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {/* Account Info */}
              {account && (
                <div className="border rounded p-2 bg-muted/20">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Cash:</span>
                      <div className="font-medium">
                        ${isNaN(parseFloat(account.cash)) ? '0' : parseFloat(account.cash).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Buying Power:</span>
                      <div className="font-medium">
                        ${isNaN(parseFloat(account.buying_power)) ? '0' : parseFloat(account.buying_power).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Portfolio:</span>
                      <div className="font-medium">
                        ${totalValue.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Positions Grid */}
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {portfolio.map((position, index) => {
                    const unrealizedPL = parseFloat(position.unrealized_pl || '0');
                    const marketValue = parseFloat(position.market_value || '0');
                    const avgPrice = parseFloat(position.avg_entry_price || '0');
                    const quantity = parseFloat(position.qty || '0');
                    const isProfit = unrealizedPL > 0;
                    
                    return (
                      <div key={index} className="p-2 border rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{position.symbol}</span>
                          <Badge variant={isProfit ? "default" : "destructive"} className="text-xs">
                            {isNaN(unrealizedPL) ? '--' : `$${unrealizedPL.toFixed(2)}`}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {quantity} @ ${isNaN(avgPrice) ? '--' : avgPrice.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl p-2">
            <div className="pb-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pending Orders</h3>
                <Badge variant="secondary" className="text-xs">
                  {pendingOrders.length} pending
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Loading orders...</p>
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    No pending orders<br/>
                    <span className="text-xs">Orders accepted on weekends will show here until market open</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map((order, index) => {
                    const isLive = order.status === 'accepted' || order.status === 'pending_new';
                    return (
                      <div key={index} className="p-2 border rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{order.symbol}</span>
                          <Badge variant={isLive ? "default" : "secondary"} className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground flex justify-between">
                          <span>{order.side.toUpperCase()} {order.qty}</span>
                          <span>{order.type}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {isLive ? 'Waiting for market open' : 'Order processing'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="watchlist" className="mt-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl p-2">
            <div className="pb-2 flex-shrink-0">
              <h3 className="text-sm font-semibold">Watchlist</h3>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                {watchlist.map((symbol, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                    <span className="font-medium">{symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {(Math.random() * 5 - 2.5).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
              
              {/* Quick trading tips integrated here */}
              <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><span>🤖</span> AI agent trades every 5 messages</div>
                <div className="flex items-center gap-1"><span>💰</span> Real paper trading via Alpaca</div>
                <div className="text-xs">Try: "What's AAPL looking like?" or "Should I buy TSLA?"</div>
              </div>
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
