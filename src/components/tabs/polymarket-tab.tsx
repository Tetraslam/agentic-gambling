'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from 'react';
import { getMarkets, SimplifiedMarket, searchMarkets } from '@/lib/apis/polymarket';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function PolymarketTab() {
  // Get reactive data from Convex
  const activeBets = useQuery(api.polymarket.getActiveBets) || [];
  const tradeCount = useQuery(api.polymarket.getTradeCount) || 0;
  const settings = useQuery(api.userSettings.getSettings);
  const updateSettings = useMutation(api.userSettings.updateSettings);

  const balance = settings?.polymarketBalance || 10000;
  const unhingedMode = settings?.polymarketUnhingedMode ?? true;

  // State for real Polymarket data
  const [markets, setMarkets] = useState<SimplifiedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const toggleUnhingedMode = () => {
    updateSettings({ polymarketUnhingedMode: !unhingedMode });
  };

  // Fetch real Polymarket data
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      const realMarkets = await getMarkets();
      setMarkets(realMarkets);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch markets:', err);
      setError('Failed to load markets. Using demo data.');
      // Fallback to demo data
      setMarkets([
        {
          id: 'demo-1',
          question: "Will Bitcoin hit $100k by end of 2024?",
          yesPrice: 0.73,
          noPrice: 0.27,
          volume: "$2.1M",
          category: "Crypto",
          endDate: "2024-12-31T23:59:59Z",
          description: "Demo market for testing",
          slug: "bitcoin-100k-2024",
          closed: false
        },
        {
          id: 'demo-2',
          question: "Will AI replace 50% of jobs by 2030?",
          yesPrice: 0.42,
          noPrice: 0.58,
          volume: "$890K",
          category: "Tech",
          endDate: "2030-12-31T23:59:59Z",
          description: "Demo market for testing",
          slug: "ai-jobs-2030",
          closed: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load markets on component mount
  useEffect(() => {
    fetchMarkets();
  }, []);

  // Auto-refresh markets every 30 seconds for demo
  useEffect(() => {
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchMarkets();
      return;
    }
    
    try {
      setSearching(true);
      const results = await searchMarkets(query);
      setMarkets(results.map(market => ({
        id: market.condition_id,
        question: market.question,
        category: market.category || 'Other',
        yesPrice: parseFloat(market.outcomePrices[0]) || 0.5,
        noPrice: parseFloat(market.outcomePrices[1]) || 0.5,
        volume: market.volumeNum > 1000000 
          ? `$${(market.volumeNum / 1000000).toFixed(1)}M`
          : `$${(market.volumeNum / 1000).toFixed(0)}K`,
        endDate: market.endDate,
        description: market.description,
        slug: market.slug,
        closed: market.closed
      })));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Markets:</span>
              <Badge variant="outline">{markets.length}</Badge>
              {loading && (
                <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={fetchMarkets}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant={unhingedMode ? "destructive" : "outline"}
            onClick={toggleUnhingedMode}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {unhingedMode ? 'UNHINGED' : 'Rational'}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {lastRefresh && (
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search markets (e.g., 'Bitcoin', 'AI', 'election')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searching && (
          <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Markets Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-auto">
        {loading && markets.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="h-fit animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          markets.map((market) => (
            <Card key={market.id} className="h-fit hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm leading-tight">
                    {market.question}
                  </CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="ml-2">
                      {market.category}
                    </Badge>
                    {market.featured && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        ⭐ Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Yes/No Prices */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col gap-1 hover:bg-green-50 hover:border-green-300"
                      onClick={() => {
                        // This would be where fake trades are placed for demo
                        console.log(`Fake bet: YES on "${market.question}"`);
                      }}
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
                      onClick={() => {
                        // This would be where fake trades are placed for demo
                        console.log(`Fake bet: NO on "${market.question}"`);
                      }}
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

                  {/* Volume and End Date */}
                  <div className="text-center space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Volume: {market.volume}
                    </div>
                    {market.endDate && (
                      <div className="text-xs text-muted-foreground">
                        Ends: {new Date(market.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
