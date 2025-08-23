import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Local UI state only - persistent data moved to Convex
interface TradingStore {
  watchlist: string[];
  currentSymbol: string; // Current symbol shown in TradingView chart
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setCurrentSymbol: (symbol: string) => void;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set) => ({
      watchlist: ['AAPL', 'TSLA', 'SPY', 'QQQ'],
      currentSymbol: 'AAPL', // Default symbol

      addToWatchlist: (symbol) => {
        set((state) => ({
          watchlist: [...new Set([...state.watchlist, symbol.toUpperCase()])]
        }));
      },

      removeFromWatchlist: (symbol) => {
        set((state) => ({
          watchlist: state.watchlist.filter(s => s !== symbol.toUpperCase())
        }));
      },

      setCurrentSymbol: (symbol) => {
        set({ currentSymbol: symbol.toUpperCase() });
      },
    }),
    {
      name: 'trading-store',
    }
  )
);
