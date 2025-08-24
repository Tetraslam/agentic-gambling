'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Volume2, Info, ExternalLink } from 'lucide-react';
import { SimplifiedMarket } from '@/lib/apis/polymarket';
import PlaceBetModal from './place-bet-modal';

interface MarketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: SimplifiedMarket | null;
  balance: number;
  demoMode: boolean;
  onPlaceBet: (market: SimplifiedMarket, position: 'yes' | 'no', amount: number) => Promise<void>;
}

export default function MarketDetailModal({
  isOpen,
  onClose,
  market,
  balance,
  demoMode,
  onPlaceBet
}: MarketDetailModalProps) {
  const [placeBetModalOpen, setPlaceBetModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');

  if (!market) return null;

  const handleOpenBetModal = (position: 'yes' | 'no') => {
    setSelectedPosition(position);
    setPlaceBetModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const timeTillEnd = market.endDate ? new Date(market.endDate).getTime() - Date.now() : null;
  const daysLeft = timeTillEnd ? Math.ceil(timeTillEnd / (1000 * 60 * 60 * 24)) : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Market Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Market Question */}
            <div>
              <h2 className="text-xl font-bold leading-tight mb-3">{market.question}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{market.category}</Badge>
                {market.featured && (
                  <Badge variant="secondary">⭐ Featured</Badge>
                )}
                {daysLeft !== null && (
                  <Badge variant={daysLeft > 7 ? "outline" : "destructive"}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Current Prices - Large Display */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <span className="text-lg font-semibold">YES</span>
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {(market.yesPrice * 100).toFixed(0)}¢
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(market.yesPrice * 100).toFixed(1)}% chance
                  </div>
                  <Button
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => handleOpenBetModal('yes')}
                  >
                    Buy YES
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <span className="text-lg font-semibold">NO</span>
                  </div>
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {(market.noPrice * 100).toFixed(0)}¢
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(market.noPrice * 100).toFixed(1)}% chance
                  </div>
                  <Button
                    className="w-full mt-4 bg-red-600 hover:bg-red-700"
                    onClick={() => handleOpenBetModal('no')}
                  >
                    Buy NO
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Market Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Trading Volume</span>
                  </div>
                  <div className="text-2xl font-bold">{market.volume}</div>
                </CardContent>
              </Card>

              {market.endDate && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Market Closes</span>
                    </div>
                    <div className="text-lg font-semibold">{formatDate(market.endDate)}</div>
                    {daysLeft !== null && (
                      <div className="text-sm text-muted-foreground">
                        {daysLeft > 0 ? `${daysLeft} days remaining` : 'Market closed'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Market Description */}
            {market.description && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Description</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {market.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Price Analysis */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Price Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">YES implied probability</div>
                    <div className="font-semibold">{(market.yesPrice * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">NO implied probability</div>
                    <div className="font-semibold">{(market.noPrice * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Breakeven if YES wins</div>
                    <div className="font-semibold">{(market.yesPrice * 100).toFixed(0)}¢</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Breakeven if NO wins</div>
                    <div className="font-semibold">{(market.noPrice * 100).toFixed(0)}¢</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Link */}
            {market.slug && (
              <Card>
                <CardContent className="p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://polymarket.com/event/${market.slug}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Polymarket
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Demo Mode Notice */}
            {demoMode && (
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  🛡️ <strong>Demo Mode:</strong> This is a simulation using fake money for testing.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Place Bet Modal */}
      <PlaceBetModal
        isOpen={placeBetModalOpen}
        onClose={() => setPlaceBetModalOpen(false)}
        market={market}
        position={selectedPosition}
        balance={balance}
        demoMode={demoMode}
        onPlaceBet={onPlaceBet}
      />
    </>
  );
}
