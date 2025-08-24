'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calculator, DollarSign } from 'lucide-react';
import { SimplifiedMarket } from '@/lib/apis/polymarket';

interface PlaceBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: SimplifiedMarket | null;
  position: 'yes' | 'no';
  balance: number;
  demoMode: boolean;
  onPlaceBet: (market: SimplifiedMarket, position: 'yes' | 'no', amount: number) => Promise<void>;
}

export default function PlaceBetModal({
  isOpen,
  onClose,
  market,
  position,
  balance,
  demoMode,
  onPlaceBet
}: PlaceBetModalProps) {
  const [amount, setAmount] = useState<string>('100');
  const [isPlacing, setIsPlacing] = useState(false);

  if (!market) return null;

  const numericAmount = parseFloat(amount) || 0;
  const odds = position === 'yes' ? market.yesPrice : market.noPrice;
  const potentialWin = numericAmount / odds;
  const profit = potentialWin - numericAmount;
  const breakEvenPrice = numericAmount / potentialWin;

  const handleAmountChange = (value: string) => {
    // Only allow valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleSubmit = async () => {
    if (numericAmount <= 0 || numericAmount > balance) return;
    
    setIsPlacing(true);
    try {
      await onPlaceBet(market, position, numericAmount);
      onClose();
      setAmount('100'); // Reset for next time
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  const isValidAmount = numericAmount > 0 && numericAmount <= balance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {position === 'yes' ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            Bet {position.toUpperCase()}
            {demoMode && <Badge variant="secondary">Demo</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Question */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium leading-tight">{market.question}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{market.category}</Badge>
              <span className="text-xs text-muted-foreground">Vol: {market.volume}</span>
            </div>
          </div>

          {/* Current Odds */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border-2 ${position === 'yes' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">YES</div>
                <div className="text-lg font-bold text-green-600">
                  {(market.yesPrice * 100).toFixed(0)}¢
                </div>
              </div>
            </div>
            <div className={`p-3 rounded-lg border-2 ${position === 'no' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">NO</div>
                <div className="text-lg font-bold text-red-600">
                  {(market.noPrice * 100).toFixed(0)}¢
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Bet Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {[25, 50, 100, 250, 500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  disabled={quickAmount > balance}
                  className="text-xs"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Available: ${balance.toLocaleString()}
            </div>
          </div>

          {/* Calculation Preview */}
          {numericAmount > 0 && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-medium">Bet Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">You pay</div>
                  <div className="font-semibold">${numericAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">You receive if right</div>
                  <div className="font-semibold text-green-600">${potentialWin.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Potential profit</div>
                  <div className={`font-semibold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Break-even price</div>
                  <div className="font-semibold">{(breakEvenPrice * 100).toFixed(0)}¢</div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {numericAmount > balance && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Insufficient balance. You have ${balance.toLocaleString()} available.
            </div>
          )}

          {!demoMode && (
            <div className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded border border-yellow-200">
              ⚠️ <strong>Real Money Warning:</strong> This will use actual funds from your account.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPlacing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || isPlacing}
            className={position === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isPlacing ? 'Placing...' : `Place ${position.toUpperCase()} Bet`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
