#!/usr/bin/env ts-node

/**
 * Manual API Testing Script for Polymarket Integration
 * This script tests the Polymarket API endpoints directly and validates data structure
 * 
 * Usage:
 * npx ts-node scripts/test-polymarket-api.ts
 * or
 * npm run test:manual
 */

import { PolymarketAPI, SimplifiedMarket, PolymarketMarket } from '../src/lib/apis/polymarket.js';
import axios from 'axios';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

class PolymarketAPITester {
  private api: PolymarketAPI;
  private results: TestResult[] = [];

  constructor() {
    this.api = new PolymarketAPI();
  }

  private addResult(name: string, success: boolean, message: string, data?: any) {
    this.results.push({ name, success, message, data });
    const icon = success ? '✅' : '❌';
    log(success ? 'green' : 'red', `${icon} ${name}: ${message}`);
    if (data && success) {
      console.log('   Sample data:', JSON.stringify(data, null, 2).slice(0, 200) + '...');
    }
  }

  async testDirectAPICall() {
    log('blue', '\n🔍 Testing Direct API Endpoints...');
    
    try {
      const response = await axios.get('https://gamma-api.polymarket.com/markets?limit=2&active=true&closed=false');
      const markets = response.data?.data || response.data;
      
      if (Array.isArray(markets) && markets.length > 0) {
        const firstMarket = markets[0];
        this.addResult(
          'Direct API Call',
          true,
          `Fetched ${markets.length} markets successfully`,
          {
            question: firstMarket.question,
            outcomePrices: firstMarket.outcomePrices,
            volume: firstMarket.volume,
            category: firstMarket.category
          }
        );
        return firstMarket;
      } else {
        this.addResult('Direct API Call', false, 'No markets returned from API');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Direct API Call', false, `API call failed: ${errorMessage}`);
      return null;
    }
  }

  async testAPIServiceMethods() {
    log('blue', '\n🔧 Testing API Service Methods...');

    // Test getMarkets
    try {
      const markets = await this.api.getMarkets(3);
      this.addResult(
        'getMarkets()',
        markets.length > 0,
        `Returned ${markets.length} markets`,
        markets.length > 0 ? { sample: markets[0].question } : null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('getMarkets()', false, `Failed: ${errorMessage}`);
    }

    // Test getFeaturedMarkets
    try {
      const featured = await this.api.getFeaturedMarkets(2);
      this.addResult(
        'getFeaturedMarkets()',
        Array.isArray(featured),
        `Returned ${featured.length} featured markets`,
        featured.length > 0 ? { sample: featured[0].question } : null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('getFeaturedMarkets()', false, `Failed: ${errorMessage}`);
    }

    // Test searchMarkets
    try {
      const searchResults = await this.api.searchMarkets('bitcoin');
      this.addResult(
        'searchMarkets("bitcoin")',
        Array.isArray(searchResults),
        `Returned ${searchResults.length} search results`,
        searchResults.length > 0 ? { sample: searchResults[0].question } : null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('searchMarkets()', false, `Failed: ${errorMessage}`);
    }

    // Test getSimplifiedMarkets
    try {
      const simplified = await this.api.getSimplifiedMarkets(2);
      this.addResult(
        'getSimplifiedMarkets()',
        Array.isArray(simplified) && simplified.every(m => m.yesPrice !== undefined),
        `Returned ${simplified.length} simplified markets`,
        simplified.length > 0 ? simplified[0] : null
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('getSimplifiedMarkets()', false, `Failed: ${errorMessage}`);
    }
  }

  async testDataValidation() {
    log('blue', '\n🔍 Testing Data Validation...');

    try {
      const markets = await this.api.getMarkets(5);
      
      if (markets.length === 0) {
        this.addResult('Data Validation', false, 'No markets to validate');
        return;
      }

      const validationResults = {
        validQuestions: 0,
        validPrices: 0,
        validVolumes: 0,
        validCategories: 0,
        validEndDates: 0
      };

      markets.forEach(market => {
        // Validate question
        if (market.question && typeof market.question === 'string' && market.question.length > 0) {
          validationResults.validQuestions++;
        }

        // Validate outcome prices
        if (market.outcomePrices && Array.isArray(market.outcomePrices)) {
          const prices = market.outcomePrices.map(p => parseFloat(p));
          if (prices.every(p => !isNaN(p) && p >= 0 && p <= 1)) {
            validationResults.validPrices++;
          }
        }

        // Validate volume
        if (market.volumeNum !== undefined && typeof market.volumeNum === 'number' && market.volumeNum >= 0) {
          validationResults.validVolumes++;
        }

        // Validate category
        if (market.category || market.subCategory) {
          validationResults.validCategories++;
        }

        // Validate end date
        if (market.endDate && !isNaN(Date.parse(market.endDate))) {
          validationResults.validEndDates++;
        }
      });

      const overallValidity = Object.values(validationResults).reduce((a, b) => a + b, 0) / (markets.length * 5);
      
      this.addResult(
        'Data Validation',
        overallValidity > 0.7, // 70% of data should be valid
        `${(overallValidity * 100).toFixed(1)}% of data fields are valid`,
        validationResults
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Data Validation', false, `Failed: ${errorMessage}`);
    }
  }

  async testTransformation() {
    log('blue', '\n🔄 Testing Data Transformation...');

    try {
      const markets = await this.api.getMarkets(3);
      
      if (markets.length === 0) {
        this.addResult('Data Transformation', false, 'No markets to transform');
        return;
      }

      const transformed = markets.map(market => this.api.transformMarketData(market));
      
      // Validate transformation
      const validTransformations = transformed.filter(t => 
        t.id && 
        t.question && 
        typeof t.yesPrice === 'number' && 
        typeof t.noPrice === 'number' &&
        t.volume &&
        t.endDate
      );

      this.addResult(
        'Data Transformation',
        validTransformations.length === transformed.length,
        `${validTransformations.length}/${transformed.length} transformations successful`,
        validTransformations[0]
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Data Transformation', false, `Failed: ${errorMessage}`);
    }
  }

  async testErrorHandling() {
    log('blue', '\n🛡️ Testing Error Handling...');

    // Test invalid search
    try {
      const emptySearch = await this.api.searchMarkets('');
      this.addResult(
        'Empty Search Handling',
        Array.isArray(emptySearch),
        `Empty search returned ${emptySearch.length} results (graceful handling)`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Empty Search Handling', false, `Failed: ${errorMessage}`);
    }

    // Test network error simulation (using invalid endpoint)
    try {
      const invalidAPI = new PolymarketAPI();
      // We can't easily test network errors without modifying the API
      // So we'll test that the API handles missing data gracefully
      
      const mockMarket: PolymarketMarket = {
        condition_id: 'test',
        question: 'Test Question',
        slug: 'test',
        resolutionSource: '',
        endDate: '2024-12-31T12:00:00Z',
        startDate: '2024-01-01T00:00:00Z',
        category: null,
        subCategory: '',
        description: '',
        outcomePrices: [], // Empty prices
        outcomes: ['Yes', 'No'],
        volume: null,
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
        enableOrderBook: true,
        orderPriceMinTickSize: 0.01,
        orderMinSize: 5,
        active: true,
        archived: false,
        commentCount: 0
      };

      const transformed = invalidAPI.transformMarketData(mockMarket);
      this.addResult(
        'Invalid Data Handling',
        transformed.yesPrice === 0.5 && transformed.noPrice === 0.5,
        'Gracefully handled missing price data with defaults'
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Invalid Data Handling', false, `Failed: ${errorMessage}`);
    }
  }

  async testPerformance() {
    log('blue', '\n⚡ Testing Performance...');

    try {
      const startTime = Date.now();
      const markets = await this.api.getMarkets(10);
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.addResult(
        'API Response Time',
        duration < 5000, // Should complete within 5 seconds
        `API call completed in ${duration}ms`,
        { duration, marketCount: markets.length }
      );

      // Test concurrent requests
      const concurrentStart = Date.now();
      const promises = [
        this.api.getMarkets(2),
        this.api.searchMarkets('test'),
        this.api.getFeaturedMarkets(2)
      ];
      
      const results = await Promise.allSettled(promises);
      const concurrentEnd = Date.now();
      const concurrentDuration = concurrentEnd - concurrentStart;

      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;

      this.addResult(
        'Concurrent Requests',
        successfulRequests >= 2, // At least 2 out of 3 should succeed
        `${successfulRequests}/3 concurrent requests succeeded in ${concurrentDuration}ms`
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Performance Test', false, `Failed: ${errorMessage}`);
    }
  }

  async runAllTests() {
    log('bold', '🚀 Starting Polymarket API Test Suite...\n');

    await this.testDirectAPICall();
    await this.testAPIServiceMethods();
    await this.testDataValidation();
    await this.testTransformation();
    await this.testErrorHandling();
    await this.testPerformance();

    this.generateReport();
  }

  generateReport() {
    log('bold', '\n📊 Test Results Summary');
    console.log('═'.repeat(50));

    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const successRate = (successful / total * 100).toFixed(1);

    log('blue', `Total Tests: ${total}`);
    log('green', `Passed: ${successful}`);
    log('red', `Failed: ${total - successful}`);
    log('bold', `Success Rate: ${successRate}%`);

    if (successful === total) {
      log('green', '\n🎉 All tests passed! Your Polymarket API integration is working correctly.');
    } else if (successful / total > 0.8) {
      log('yellow', '\n⚠️ Most tests passed, but some issues detected. Check failed tests above.');
    } else {
      log('red', '\n❌ Multiple test failures detected. API integration needs attention.');
    }

    // Detailed failure report
    const failures = this.results.filter(r => !r.success);
    if (failures.length > 0) {
      log('red', '\n🔍 Failed Tests Details:');
      failures.forEach(failure => {
        console.log(`   • ${failure.name}: ${failure.message}`);
      });
    }

    console.log('\n' + '═'.repeat(50));
    log('blue', 'Test suite completed. Use this data to verify your hackathon demo!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PolymarketAPITester();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export default PolymarketAPITester;
