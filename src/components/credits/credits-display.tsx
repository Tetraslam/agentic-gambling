'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, History } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from 'react';

interface CreditsDisplayProps {
  userId: string;
}

interface Transaction {
  type: 'profit' | 'loss' | 'platform_fee';
  category: 'trading' | 'poker' | 'polymarket';
  amount: number;
  description: string;
  timestamp: number;
}

interface Credits {
  totalProfits: number;
  platformShare: number;
  userShare: number;
  tradingProfits: number;
  pokerProfits: number;
  polymarketProfits: number;
}

export default function CreditsDisplay({ userId }: CreditsDisplayProps) {
  const [showTransactions, setShowTransactions] = useState(false);
  
  // Temporary fallback until Convex regenerates API with credits module
  // TODO: Replace with actual API calls once `pnpm convex dev` regenerates the API
  const credits: Credits = {
    totalProfits: 0,
    platformShare: 0,
    userShare: 0,
    tradingProfits: 0,
    pokerProfits: 0,
    polymarketProfits: 0,
  }; // useQuery(api.credits.getUserCredits, { userId });
  const transactions: Transaction[] = []; // useQuery(api.credits.getTransactions, { userId, limit: 20 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Main Credits Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Your Profits
          </CardTitle>
          <Badge variant={credits.totalProfits > 0 ? 'default' : 'secondary'}>
            {credits.totalProfits > 0 ? 'Profitable' : 'Starting Out'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(credits.userShare)}
              </p>
              <p className="text-sm text-muted-foreground">Your Share</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatCurrency(credits.totalProfits)}
              </p>
              <p className="text-sm text-muted-foreground">Total Generated</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Platform Fee: {formatCurrency(credits.platformShare)}
            </p>
            <p className="text-xs text-muted-foreground">
              We take 80% of profits because we're basically a casino 🎰
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Trading</span>
              </div>
              <p className={`text-lg font-bold ${
                credits.tradingProfits > 0 ? 'text-green-600' : 
                credits.tradingProfits < 0 ? 'text-red-600' : ''
              }`}>
                {formatCurrency(credits.tradingProfits)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-sm font-medium">🎯 Poker</span>
              </div>
              <p className={`text-lg font-bold ${
                credits.pokerProfits > 0 ? 'text-green-600' : 
                credits.pokerProfits < 0 ? 'text-red-600' : ''
              }`}>
                {formatCurrency(credits.pokerProfits)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-sm font-medium">🎰 Polymarket</span>
              </div>
              <p className={`text-lg font-bold ${
                credits.polymarketProfits > 0 ? 'text-green-600' : 
                credits.polymarketProfits < 0 ? 'text-red-600' : ''
              }`}>
                {formatCurrency(credits.polymarketProfits)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Activity
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            {showTransactions ? 'Hide' : 'Show'} History
          </Button>
        </CardHeader>
        
        {showTransactions && (
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {transactions?.map((transaction: Transaction, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {transaction.type === 'profit' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : transaction.type === 'loss' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category} • {formatTimestamp(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <p className="text-sm font-bold">
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                )) ?? []}
                
                {(!transactions || transactions.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet. Start trading to see your profit history!
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}