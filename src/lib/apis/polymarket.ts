import axios from 'axios';

// Polymarket Data API base URL
const POLYMARKET_DATA_API = 'https://data-api.polymarket.com';
const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

// Types for Polymarket API responses
export interface PolymarketMarket {
  conditionId: string;
  question: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  startDate: string;
  category: string | null;
  subCategory: string;
  description: string;
  outcomePrices: string[];
  outcomes: string[];
  volume: string | null;
  volumeNum: number;
  liquidity: string | null;
  liquidityNum: number;
  closed: boolean;
  marketMakerAddress: string;
  clobTokenIds: string[];
  spread: number;
  reportingState: string;
  tags: string[];
  gameType: string;
  groupItemTitle?: string;
  groupItemThreshold?: number;
  hasReviewedEndpoint?: boolean;
  image?: string;
  icon?: string;
  fpmm?: string;
  new?: boolean;
  featured?: number;
  slug_?: string;
  marketSlug?: string;
  rewardsMaxSpread?: number;
  rewardsMinNotional?: number;
  acceptingOrders: boolean;
  negRisk?: boolean;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  active: boolean;
  archived: boolean;
  fundingReward?: number;
  spreadMax?: number;
  automaticSpreadEnabled?: boolean;
  commentCount: number;
}

export interface SimplifiedMarket {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  description: string;
  slug: string;
  closed: boolean;
  featured?: boolean;
}

export class PolymarketAPI {
  private static instance: PolymarketAPI;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  public static getInstance(apiKey?: string): PolymarketAPI {
    if (!PolymarketAPI.instance) {
      PolymarketAPI.instance = new PolymarketAPI(apiKey);
    }
    return PolymarketAPI.instance;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
    };
  }

  /**
   * Fetch all active markets from Polymarket
   */
  async getMarkets(limit = 50, offset = 0): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
        headers: this.getHeaders(),
        params: {
          limit,
          offset,
          active: true,
          closed: false,
          order: 'volume24hr',
          ascending: false,
        },
      });
      
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching Polymarket markets:', error);
      return [];
    }
  }

  /**
   * Fetch featured/trending markets
   */
  async getFeaturedMarkets(limit = 20): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
        headers: this.getHeaders(),
        params: {
          limit,
          active: true,
          closed: false,
          order: 'featured',
          ascending: false,
        },
      });
      
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching featured markets:', error);
      // Fallback to regular markets
      return this.getMarkets(limit);
    }
  }

  /**
   * Search markets by query
   */
  async searchMarkets(query: string, limit = 20): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
        headers: this.getHeaders(),
        params: {
          limit,
          active: true,
          closed: false,
          order: 'volume24hr',
          ascending: false,
          query,
        },
      });
      
      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching Polymarket markets:', error);
      return [];
    }
  }

  /**
   * Get markets by category
   */
  async getMarketsByCategory(category: string, limit = 20): Promise<PolymarketMarket[]> {
    try {
      const response = await axios.get(`${POLYMARKET_GAMMA_API}/markets`, {
        headers: this.getHeaders(),
        params: {
          limit,
          active: true,
          closed: false,
          category,
          order: 'volume24hr',
          ascending: false,
        },
      });
      
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching markets by category:', error);
      return [];
    }
  }

  /**
   * Transform Polymarket data to simplified format for UI
   */
  transformMarketData(market: PolymarketMarket): SimplifiedMarket {
    // Parse outcome prices (usually [yes_price, no_price])
    const prices = market.outcomePrices.map(price => parseFloat(price));
    const yesPrice = prices[0] || 0.5;
    const noPrice = prices[1] || (1 - yesPrice);

    // Format volume
    const volumeNum = market.volumeNum || 0;
    const volume = volumeNum > 1000000 
      ? `$${(volumeNum / 1000000).toFixed(1)}M`
      : volumeNum > 1000
      ? `$${(volumeNum / 1000).toFixed(0)}K`
      : `$${volumeNum.toFixed(0)}`;

    return {
      id: market.conditionId,
      question: market.question,
      category: market.category || market.subCategory || 'Other',
      yesPrice,
      noPrice,
      volume,
      endDate: market.endDate,
      description: market.description,
      slug: market.slug,
      closed: market.closed,
      featured: market.featured ? market.featured > 0 : false,
    };
  }

  /**
   * Get simplified market data ready for UI consumption
   */
  async getSimplifiedMarkets(limit = 20): Promise<SimplifiedMarket[]> {
    try {
      const markets = await this.getFeaturedMarkets(limit);
      return markets.map(market => this.transformMarketData(market));
    } catch (error) {
      console.error('Error getting simplified markets:', error);
      return [];
    }
  }

  /**
   * Get random markets for the "unhinged" agent to trade on
   */
  async getRandomMarkets(count = 10): Promise<SimplifiedMarket[]> {
    try {
      const allMarkets = await this.getMarkets(100);
      const shuffled = allMarkets.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      return selected.map(market => this.transformMarketData(market));
    } catch (error) {
      console.error('Error getting random markets:', error);
      return [];
    }
  }
}

// Export singleton instance
export const polymarketAPI = PolymarketAPI.getInstance();

// Export helper functions
export const getMarkets = () => polymarketAPI.getSimplifiedMarkets();
export const searchMarkets = (query: string) => polymarketAPI.searchMarkets(query);
export const getRandomMarkets = (count?: number) => polymarketAPI.getRandomMarkets(count);
