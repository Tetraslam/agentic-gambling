import { PolymarketAPI, SimplifiedMarket, PolymarketMarket } from '../polymarket';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PolymarketAPI', () => {
  let api: PolymarketAPI;
  
  beforeEach(() => {
    api = new PolymarketAPI();
    jest.clearAllMocks();
  });

  describe('API Response Structure Tests', () => {
    test('should handle valid market response with all fields', async () => {
      const mockMarkets: PolymarketMarket[] = [
        {
          conditionId: 'test-id-1',
          question: 'Fed rate hike in 2025?',
          slug: 'fed-rate-hike-2025',
          resolutionSource: 'Federal Reserve',
          endDate: '2025-12-10T12:00:00Z',
          startDate: '2024-12-29T22:50:33.584839Z',
          category: 'Finance',
          subCategory: 'Federal Reserve',
          description: 'Test market description',
          outcomePrices: ['0.045', '0.955'],
          outcomes: ['Yes', 'No'],
          volume: '500996.862063',
          volumeNum: 500996.862063,
          liquidity: '19629.316',
          liquidityNum: 19629.316,
          closed: false,
          marketMakerAddress: '0x123',
          clobTokenIds: ['token1', 'token2'],
          spread: 0.01,
          reportingState: 'active',
          tags: ['federal-reserve', 'rates'],
          gameType: 'single',
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          active: true,
          archived: false,
          commentCount: 15
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockMarkets }
      });

      const result = await api.getMarkets();
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/polymarket/markets',
        expect.objectContaining({
          params: {
            limit: 50,
            offset: 0,
            order: 'volume24hr',
            ascending: false,
          }
        })
      );
      
      expect(result).toEqual(mockMarkets);
    });

    test('should handle market response with missing optional fields', async () => {
      const mockMarkets: PolymarketMarket[] = [
        {
          condition_id: 'test-id-2',
          question: 'Will Bitcoin hit $100k?',
          slug: 'bitcoin-100k',
          resolutionSource: '',
          endDate: '2024-12-31T12:00:00Z',
          startDate: '2024-01-01T00:00:00Z',
          category: null, // This can be null
          subCategory: '',
          description: 'Bitcoin price prediction',
          outcomePrices: ['0.73', '0.27'],
          outcomes: ['Yes', 'No'],
          volume: null, // This can be null
          volumeNum: 0,
          liquidity: null,
          liquidityNum: 0,
          closed: false,
          marketMakerAddress: '',
          clobTokenIds: [],
          spread: 0,
          reportingState: 'active',
          tags: [],
          gameType: 'single',
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          active: true,
          archived: false,
          commentCount: 0
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockMarkets }
      });

      const result = await api.getMarkets();
      expect(result).toEqual(mockMarkets);
    });

    test('should handle API error gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.getMarkets();
      expect(result).toEqual([]);
    });

    test('should handle empty API response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      const result = await api.getMarkets();
      expect(result).toEqual([]);
    });

    test('should handle malformed API response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: null
      });

      const result = await api.getMarkets();
      expect(result).toEqual([]);
    });
  });

  describe('Data Transformation Tests', () => {
    test('should correctly transform market data with all fields', () => {
      const mockMarket: PolymarketMarket = {
        conditionId: 'test-id-1',
        question: 'Will AI replace 50% of jobs by 2030?',
        slug: 'ai-jobs-2030',
        resolutionSource: 'Bureau of Labor Statistics',
        endDate: '2030-12-31T23:59:59Z',
        startDate: '2024-01-01T00:00:00Z',
        category: 'Technology',
        subCategory: 'Artificial Intelligence',
        description: 'Market about AI job displacement',
        outcomePrices: ['0.42', '0.58'],
        outcomes: ['Yes', 'No'],
        volume: '890000',
        volumeNum: 890000,
        liquidity: '50000',
        liquidityNum: 50000,
        closed: false,
        marketMakerAddress: '0x456',
        clobTokenIds: ['token3', 'token4'],
        spread: 0.02,
        reportingState: 'active',
        tags: ['ai', 'jobs'],
        gameType: 'single',
        featured: 1,
        acceptingOrders: true,
        orderPriceMinTickSize: 0.01,
        orderMinSize: 5,
        active: true,
        archived: false,
        commentCount: 25
      };

      const result = api.transformMarketData(mockMarket);

      expect(result).toEqual({
        id: 'test-id-1',
        question: 'Will AI replace 50% of jobs by 2030?',
        category: 'Technology',
        yesPrice: 0.42,
        noPrice: 0.58,
        volume: '$890K',
        endDate: '2030-12-31T23:59:59Z',
        description: 'Market about AI job displacement',
        slug: 'ai-jobs-2030',
        closed: false,
        featured: true
      });
    });

    test('should handle missing category correctly', () => {
      const mockMarket: PolymarketMarket = {
        condition_id: 'test-id-2',
        question: 'Test question',
        slug: 'test-slug',
        resolutionSource: '',
        endDate: '2024-12-31T12:00:00Z',
        startDate: '2024-01-01T00:00:00Z',
        category: null,
        subCategory: 'Economics',
        description: 'Test description',
        outcomePrices: ['0.5', '0.5'],
        outcomes: ['Yes', 'No'],
        volume: '0',
        volumeNum: 0,
        liquidity: '0',
        liquidityNum: 0,
        closed: false,
        marketMakerAddress: '',
        clobTokenIds: [],
        spread: 0,
        reportingState: 'active',
        tags: [],
        gameType: 'single',
        acceptingOrders: true,
        orderPriceMinTickSize: 0.01,
        orderMinSize: 5,
        active: true,
        archived: false,
        commentCount: 0
      };

      const result = api.transformMarketData(mockMarket);

      expect(result.category).toBe('Economics'); // Should fallback to subCategory
    });

    test('should format large volumes correctly', () => {
      const testCases = [
        { volumeNum: 1500000, expected: '$1.5M' },
        { volumeNum: 890000, expected: '$890K' },
        { volumeNum: 1500, expected: '$2K' }, // Fixed: 1500 rounds to 2K
        { volumeNum: 500, expected: '$500' },
        { volumeNum: 0, expected: '$0' }
      ];

      testCases.forEach(({ volumeNum, expected }) => {
        const mockMarket: PolymarketMarket = {
          conditionId: 'test-id',
          question: 'Test question',
          slug: 'test-slug',
          resolutionSource: '',
          endDate: '2024-12-31T12:00:00Z',
          startDate: '2024-01-01T00:00:00Z',
          category: 'Test',
          subCategory: '',
          description: 'Test description',
          outcomePrices: ['0.5', '0.5'],
          outcomes: ['Yes', 'No'],
          volume: volumeNum.toString(),
          volumeNum: volumeNum,
          liquidity: '0',
          liquidityNum: 0,
          closed: false,
          marketMakerAddress: '',
          clobTokenIds: [],
          spread: 0,
          reportingState: 'active',
          tags: [],
          gameType: 'single',
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          active: true,
          archived: false,
          commentCount: 0
        };

        const result = api.transformMarketData(mockMarket);
        expect(result.volume).toBe(expected);
      });
    });

    test('should handle invalid outcome prices gracefully', () => {
      const mockMarket: PolymarketMarket = {
        condition_id: 'test-id',
        question: 'Test question',
        slug: 'test-slug',
        resolutionSource: '',
        endDate: '2024-12-31T12:00:00Z',
        startDate: '2024-01-01T00:00:00Z',
        category: 'Test',
        subCategory: '',
        description: 'Test description',
        outcomePrices: [], // Empty array
        outcomes: ['Yes', 'No'],
        volume: '1000',
        volumeNum: 1000,
        liquidity: '0',
        liquidityNum: 0,
        closed: false,
        marketMakerAddress: '',
        clobTokenIds: [],
        spread: 0,
        reportingState: 'active',
        tags: [],
        gameType: 'single',
        acceptingOrders: true,
        orderPriceMinTickSize: 0.01,
        orderMinSize: 5,
        active: true,
        archived: false,
        commentCount: 0
      };

      const result = api.transformMarketData(mockMarket);
      
      expect(result.yesPrice).toBe(0.5); // Default fallback
      expect(result.noPrice).toBe(0.5); // Calculated as 1 - yesPrice
    });
  });

  describe('Search Functionality Tests', () => {
    test('should call search endpoint with correct parameters', async () => {
      const mockMarkets: PolymarketMarket[] = [];
      
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockMarkets }
      });

      await api.searchMarkets('bitcoin');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/polymarket/search',
        expect.objectContaining({
          params: {
            query: 'bitcoin',
            limit: 20,
          }
        })
      );
    });

    test('should handle search with empty query', async () => {
      const result = await api.searchMarkets('');
      expect(result).toEqual([]);
    });
  });

  describe('Featured Markets Tests', () => {
    test('should call featured markets endpoint correctly', async () => {
      const mockMarkets: PolymarketMarket[] = [];
      
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockMarkets }
      });

      await api.getFeaturedMarkets();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/polymarket/featured',
        expect.objectContaining({
          params: {
            limit: 20,
          }
        })
      );
    });

    test('should fallback to regular markets if featured markets fail', async () => {
      // First call (featured) fails
      mockedAxios.get.mockRejectedValueOnce(new Error('Featured markets error'));
      
      // Second call (fallback) succeeds
      const fallbackMarkets: PolymarketMarket[] = [
        {
          condition_id: 'fallback-id',
          question: 'Fallback question',
          slug: 'fallback-slug',
          resolutionSource: '',
          endDate: '2024-12-31T12:00:00Z',
          startDate: '2024-01-01T00:00:00Z',
          category: 'Test',
          subCategory: '',
          description: 'Fallback market',
          outcomePrices: ['0.5', '0.5'],
          outcomes: ['Yes', 'No'],
          volume: '1000',
          volumeNum: 1000,
          liquidity: '0',
          liquidityNum: 0,
          closed: false,
          marketMakerAddress: '',
          clobTokenIds: [],
          spread: 0,
          reportingState: 'active',
          tags: [],
          gameType: 'single',
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          active: true,
          archived: false,
          commentCount: 0
        }
      ];
      
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: fallbackMarkets }
      });

      const result = await api.getFeaturedMarkets();
      
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(fallbackMarkets);
    });
  });

  describe('Integration with getSimplifiedMarkets', () => {
    test('should return correctly transformed simplified markets', async () => {
      const mockMarkets: PolymarketMarket[] = [
        {
          conditionId: 'integrated-test-1',
          question: 'Integration test question',
          slug: 'integration-test',
          resolutionSource: 'Test source',
          endDate: '2024-12-31T12:00:00Z',
          startDate: '2024-01-01T00:00:00Z',
          category: 'Integration',
          subCategory: '',
          description: 'Integration test market',
          outcomePrices: ['0.3', '0.7'],
          outcomes: ['Yes', 'No'],
          volume: '2500000',
          volumeNum: 2500000,
          liquidity: '100000',
          liquidityNum: 100000,
          closed: false,
          marketMakerAddress: '',
          clobTokenIds: [],
          spread: 0,
          reportingState: 'active',
          tags: [],
          gameType: 'single',
          featured: 1,
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          active: true,
          archived: false,
          commentCount: 10
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockMarkets }
      });

      const result = await api.getSimplifiedMarkets();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'integrated-test-1',
        question: 'Integration test question',
        category: 'Integration',
        yesPrice: 0.3,
        noPrice: 0.7,
        volume: '$2.5M',
        endDate: '2024-12-31T12:00:00Z',
        description: 'Integration test market',
        slug: 'integration-test',
        closed: false,
        featured: true
      });
    });
  });
});

describe('Helper Functions', () => {
  test('getMarkets helper should work correctly', async () => {
    const mockMarkets: PolymarketMarket[] = [];
    
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMarkets }
    });

    // Import the helper function
    const { getMarkets } = require('../polymarket');
    
    const result = await getMarkets();
    expect(Array.isArray(result)).toBe(true);
  });

  test('searchMarkets helper should work correctly', async () => {
    const mockMarkets: PolymarketMarket[] = [];
    
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMarkets }
    });

    const { searchMarkets } = require('../polymarket');
    
    const result = await searchMarkets('test query');
    expect(Array.isArray(result)).toBe(true);
  });

  test('getRandomMarkets helper should work correctly', async () => {
    const mockMarkets: PolymarketMarket[] = [];
    
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMarkets }
    });

    const { getRandomMarkets } = require('../polymarket');
    
    const result = await getRandomMarkets(5);
    expect(Array.isArray(result)).toBe(true);
  });
});
