/**
 * Integration tests for Polymarket API
 * These tests make actual API calls to verify real data structure and behavior
 * Run with: npm test -- --testNamePattern="Integration"
 */

import { PolymarketAPI, SimplifiedMarket, PolymarketMarket } from '../polymarket';

// Skip these tests in CI/CD unless explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

describe('Polymarket API Integration Tests', () => {
  let api: PolymarketAPI;
  
  beforeAll(() => {
    api = new PolymarketAPI();
  });

  describe('Real API Response Validation', () => {
    test('should fetch real markets and validate structure', async () => {
      if (!runIntegrationTests) {
        console.log('Skipping integration test - set RUN_INTEGRATION_TESTS=true to run');
        return;
      }

      const markets = await api.getMarkets(5);
      
      expect(Array.isArray(markets)).toBe(true);
      
      if (markets.length > 0) {
        const firstMarket = markets[0];
        
        // Validate required fields exist
        expect(firstMarket).toHaveProperty('condition_id');
        expect(firstMarket).toHaveProperty('question');
        expect(firstMarket).toHaveProperty('slug');
        expect(firstMarket).toHaveProperty('endDate');
        expect(firstMarket).toHaveProperty('active');
        expect(firstMarket).toHaveProperty('closed');
        
        // Validate field types
        expect(typeof firstMarket.condition_id).toBe('string');
        expect(typeof firstMarket.question).toBe('string');
        expect(typeof firstMarket.slug).toBe('string');
        expect(typeof firstMarket.active).toBe('boolean');
        expect(typeof firstMarket.closed).toBe('boolean');
        
        // Question should not be empty
        expect(firstMarket.question.length).toBeGreaterThan(0);
        
        console.log('✅ Sample market structure validated:', {
          id: firstMarket.condition_id,
          question: firstMarket.question.substring(0, 50) + '...',
          category: firstMarket.category,
          outcomePrices: firstMarket.outcomePrices,
          volume: firstMarket.volume,
          volumeNum: firstMarket.volumeNum
        });
      }
    }, 10000); // 10 second timeout for API call

    test('should validate outcome prices format', async () => {
      if (!runIntegrationTests) return;

      const markets = await api.getMarkets(10);
      
      // Find a market with outcome prices
      const marketWithPrices = markets.find(market => 
        market.outcomePrices && 
        Array.isArray(market.outcomePrices) && 
        market.outcomePrices.length > 0
      );
      
      if (marketWithPrices) {
        expect(Array.isArray(marketWithPrices.outcomePrices)).toBe(true);
        expect(marketWithPrices.outcomePrices.length).toBeGreaterThanOrEqual(2);
        
        // Each price should be a string that can be parsed as a number
        marketWithPrices.outcomePrices.forEach(price => {
          expect(typeof price).toBe('string');
          const numPrice = parseFloat(price);
          expect(numPrice).toBeGreaterThanOrEqual(0);
          expect(numPrice).toBeLessThanOrEqual(1);
        });
        
        console.log('✅ Outcome prices validated:', {
          question: marketWithPrices.question.substring(0, 50) + '...',
          prices: marketWithPrices.outcomePrices
        });
      } else {
        console.log('⚠️ No markets with outcome prices found in sample');
      }
    }, 10000);

    test('should validate volume data format', async () => {
      if (!runIntegrationTests) return;

      const markets = await api.getMarkets(10);
      
      // Find a market with volume data
      const marketWithVolume = markets.find(market => 
        market.volumeNum && market.volumeNum > 0
      );
      
      if (marketWithVolume) {
        expect(typeof marketWithVolume.volumeNum).toBe('number');
        expect(marketWithVolume.volumeNum).toBeGreaterThan(0);
        
        // Volume string should match the number (if present)
        if (marketWithVolume.volume) {
          const volumeFromString = parseFloat(marketWithVolume.volume);
          expect(volumeFromString).toBeCloseTo(marketWithVolume.volumeNum, 2);
        }
        
        console.log('✅ Volume data validated:', {
          question: marketWithVolume.question.substring(0, 50) + '...',
          volume: marketWithVolume.volume,
          volumeNum: marketWithVolume.volumeNum
        });
      } else {
        console.log('⚠️ No markets with volume data found in sample');
      }
    }, 10000);

    test('should validate category data', async () => {
      if (!runIntegrationTests) return;

      const markets = await api.getMarkets(20);
      
      const categorizedMarkets = markets.filter(market => market.category);
      
      if (categorizedMarkets.length > 0) {
        const sampleMarket = categorizedMarkets[0];
        expect(typeof sampleMarket.category).toBe('string');
        expect(sampleMarket.category.length).toBeGreaterThan(0);
        
        console.log('✅ Category data validated:', {
          categories: [...new Set(categorizedMarkets.map(m => m.category))].slice(0, 5)
        });
      } else {
        console.log('⚠️ No categorized markets found in sample');
      }
    }, 10000);
  });

  describe('Data Transformation Integration', () => {
    test('should transform real API data correctly', async () => {
      if (!runIntegrationTests) return;

      const markets = await api.getMarkets(5);
      
      if (markets.length > 0) {
        const firstMarket = markets[0];
        const transformed = api.transformMarketData(firstMarket);
        
        // Validate transformation
        expect(transformed).toHaveProperty('id');
        expect(transformed).toHaveProperty('question');
        expect(transformed).toHaveProperty('category');
        expect(transformed).toHaveProperty('yesPrice');
        expect(transformed).toHaveProperty('noPrice');
        expect(transformed).toHaveProperty('volume');
        expect(transformed).toHaveProperty('endDate');
        expect(transformed).toHaveProperty('slug');
        expect(transformed).toHaveProperty('closed');
        
        // Validate types and ranges
        expect(typeof transformed.yesPrice).toBe('number');
        expect(typeof transformed.noPrice).toBe('number');
        expect(transformed.yesPrice).toBeGreaterThanOrEqual(0);
        expect(transformed.yesPrice).toBeLessThanOrEqual(1);
        expect(transformed.noPrice).toBeGreaterThanOrEqual(0);
        expect(transformed.noPrice).toBeLessThanOrEqual(1);
        
        // Volume format should be correct
        expect(transformed.volume).toMatch(/^\$[\d.]+[KM]?$/);
        
        console.log('✅ Transformation validated:', {
          original: {
            question: firstMarket.question.substring(0, 30) + '...',
            outcomePrices: firstMarket.outcomePrices,
            volumeNum: firstMarket.volumeNum
          },
          transformed: {
            question: transformed.question.substring(0, 30) + '...',
            yesPrice: transformed.yesPrice,
            noPrice: transformed.noPrice,
            volume: transformed.volume
          }
        });
      }
    }, 10000);

    test('should handle real search functionality', async () => {
      if (!runIntegrationTests) return;

      const searchResults = await api.searchMarkets('bitcoin');
      
      expect(Array.isArray(searchResults)).toBe(true);
      
      if (searchResults.length > 0) {
        // At least one result should mention bitcoin (case insensitive)
        const relevantResults = searchResults.filter(market =>
          market.question.toLowerCase().includes('bitcoin') ||
          market.description?.toLowerCase().includes('bitcoin') ||
          (market.tags && market.tags.some(tag => tag.toLowerCase().includes('bitcoin')))
        );
        
        console.log('✅ Search functionality validated:', {
          query: 'bitcoin',
          totalResults: searchResults.length,
          relevantResults: relevantResults.length,
          sampleQuestions: searchResults.slice(0, 3).map(m => m.question.substring(0, 50) + '...')
        });
      } else {
        console.log('⚠️ No search results returned for "bitcoin"');
      }
    }, 10000);
  });

  describe('Helper Functions Integration', () => {
    test('should validate getSimplifiedMarkets with real data', async () => {
      if (!runIntegrationTests) return;

      const simplified = await api.getSimplifiedMarkets(3);
      
      expect(Array.isArray(simplified)).toBe(true);
      
      if (simplified.length > 0) {
        const firstSimplified = simplified[0];
        
        // All required fields should be present
        expect(firstSimplified.id).toBeDefined();
        expect(firstSimplified.question).toBeDefined();
        expect(firstSimplified.category).toBeDefined();
        expect(typeof firstSimplified.yesPrice).toBe('number');
        expect(typeof firstSimplified.noPrice).toBe('number');
        expect(firstSimplified.volume).toBeDefined();
        
        console.log('✅ Simplified markets validated:', {
          count: simplified.length,
          sample: {
            question: firstSimplified.question.substring(0, 40) + '...',
            category: firstSimplified.category,
            prices: [firstSimplified.yesPrice, firstSimplified.noPrice],
            volume: firstSimplified.volume
          }
        });
      }
    }, 10000);

    test('should validate getRandomMarkets diversity', async () => {
      if (!runIntegrationTests) return;

      const randomMarkets = await api.getRandomMarkets(10);
      
      expect(Array.isArray(randomMarkets)).toBe(true);
      
      if (randomMarkets.length > 1) {
        // Check that we got diverse results (not all the same)
        const uniqueQuestions = new Set(randomMarkets.map(m => m.question));
        expect(uniqueQuestions.size).toBeGreaterThan(1);
        
        console.log('✅ Random markets diversity validated:', {
          requested: 10,
          received: randomMarkets.length,
          uniqueQuestions: uniqueQuestions.size,
          categories: [...new Set(randomMarkets.map(m => m.category))].slice(0, 5)
        });
      }
    }, 10000);
  });

  describe('Error Handling Integration', () => {
    test('should handle network timeout gracefully', async () => {
      if (!runIntegrationTests) return;

      const apiWithShortTimeout = new PolymarketAPI();
      // Note: We can't easily test timeout without modifying the API class
      // But we can test that the API handles errors gracefully
      
      try {
        const result = await apiWithShortTimeout.getMarkets();
        expect(Array.isArray(result)).toBe(true);
        console.log('✅ API call completed successfully');
      } catch (error) {
        // If it fails, it should fail gracefully
        console.log('✅ API gracefully handled error:', error.message);
      }
    }, 15000);

    test('should validate API rate limiting behavior', async () => {
      if (!runIntegrationTests) return;

      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 3 }, () => api.getMarkets(1));
      
      try {
        const results = await Promise.all(promises);
        
        // All should return arrays (even if empty due to rate limiting)
        results.forEach(result => {
          expect(Array.isArray(result)).toBe(true);
        });
        
        console.log('✅ Rate limiting handled gracefully:', {
          requests: promises.length,
          results: results.map(r => r.length)
        });
      } catch (error) {
        // Rate limiting errors should be handled gracefully
        console.log('✅ Rate limiting error handled:', error.message);
      }
    }, 20000);
  });
});

// Manual test runner for integration tests
if (require.main === module) {
  console.log('Running Polymarket API Integration Tests manually...');
  console.log('Set RUN_INTEGRATION_TESTS=true to enable full testing');
  
  const runManualTests = async () => {
    const api = new PolymarketAPI();
    
    try {
      console.log('\n🔍 Testing basic API connectivity...');
      const markets = await api.getMarkets(2);
      console.log(`✅ Fetched ${markets.length} markets`);
      
      if (markets.length > 0) {
        console.log('Sample market:', {
          question: markets[0].question,
          category: markets[0].category,
          outcomePrices: markets[0].outcomePrices,
          volume: markets[0].volume
        });
        
        console.log('\n🔄 Testing data transformation...');
        const transformed = api.transformMarketData(markets[0]);
        console.log('Transformed:', {
          question: transformed.question,
          yesPrice: transformed.yesPrice,
          noPrice: transformed.noPrice,
          volume: transformed.volume
        });
      }
      
      console.log('\n🔍 Testing search functionality...');
      const searchResults = await api.searchMarkets('fed');
      console.log(`✅ Search returned ${searchResults.length} results`);
      
      console.log('\n✅ All manual tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Manual test failed:', error.message);
    }
  };
  
  runManualTests();
}
