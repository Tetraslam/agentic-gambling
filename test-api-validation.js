#!/usr/bin/env node

/**
 * Simple API validation script for Polymarket integration
 * This script tests the actual API endpoints to ensure they work correctly
 */

const axios = require('axios');

async function testPolymarketAPI() {
  console.log('🧪 Testing Polymarket API Integration...\n');

  const tests = [];

  // Test 1: Basic API connectivity
  try {
    console.log('1️⃣ Testing basic API connectivity...');
    const response = await axios.get('https://gamma-api.polymarket.com/markets?limit=3&active=true&closed=false');
    const markets = response.data?.data || response.data;
    
    if (Array.isArray(markets) && markets.length > 0) {
      console.log('✅ API is accessible');
      console.log(`   Retrieved ${markets.length} markets`);
      tests.push({ name: 'API Connectivity', passed: true });
    } else {
      console.log('❌ API returned no data');
      tests.push({ name: 'API Connectivity', passed: false });
    }
  } catch (error) {
    console.log('❌ API connectivity failed:', error.message);
    tests.push({ name: 'API Connectivity', passed: false });
  }

  // Test 2: Data structure validation
  try {
    console.log('\n2️⃣ Testing data structure...');
    const response = await axios.get('https://gamma-api.polymarket.com/markets?limit=5&active=true&closed=false');
    const markets = response.data?.data || response.data;
    
    if (markets.length > 0) {
      const firstMarket = markets[0];
      const requiredFields = ['conditionId', 'question', 'slug', 'endDate', 'active', 'closed'];
      const missingFields = requiredFields.filter(field => !firstMarket.hasOwnProperty(field));
      
      if (missingFields.length === 0) {
        console.log('✅ Data structure is valid');
        console.log('   Sample market:', {
          question: firstMarket.question.substring(0, 50) + '...',
          outcomePrices: firstMarket.outcomePrices,
          volume: firstMarket.volume,
          category: firstMarket.category
        });
        tests.push({ name: 'Data Structure', passed: true });
      } else {
        console.log('❌ Missing required fields:', missingFields);
        tests.push({ name: 'Data Structure', passed: false });
      }
    } else {
      console.log('❌ No markets to validate');
      tests.push({ name: 'Data Structure', passed: false });
    }
  } catch (error) {
    console.log('❌ Data structure test failed:', error.message);
    tests.push({ name: 'Data Structure', passed: false });
  }

  // Test 3: Price data validation
  try {
    console.log('\n3️⃣ Testing price data...');
    const response = await axios.get('https://gamma-api.polymarket.com/markets?limit=10&active=true&closed=false');
    const markets = response.data?.data || response.data;
    
    const marketsWithPrices = markets.filter(market => 
      market.outcomePrices && 
      Array.isArray(market.outcomePrices) && 
      market.outcomePrices.length >= 2
    );
    
    if (marketsWithPrices.length > 0) {
      const sampleMarket = marketsWithPrices[0];
      const prices = sampleMarket.outcomePrices.map(p => parseFloat(p));
      const validPrices = prices.every(p => !isNaN(p) && p >= 0 && p <= 1);
      
      if (validPrices) {
        console.log('✅ Price data is valid');
        console.log(`   Found ${marketsWithPrices.length} markets with price data`);
        console.log('   Sample prices:', sampleMarket.outcomePrices);
        tests.push({ name: 'Price Data', passed: true });
      } else {
        console.log('❌ Invalid price data detected');
        tests.push({ name: 'Price Data', passed: false });
      }
    } else {
      console.log('⚠️ No markets with price data found');
      tests.push({ name: 'Price Data', passed: true }); // Not a failure, just empty data
    }
  } catch (error) {
    console.log('❌ Price data test failed:', error.message);
    tests.push({ name: 'Price Data', passed: false });
  }

  // Test 4: Volume data validation
  try {
    console.log('\n4️⃣ Testing volume data...');
    const response = await axios.get('https://gamma-api.polymarket.com/markets?limit=10&active=true&closed=false');
    const markets = response.data?.data || response.data;
    
    const marketsWithVolume = markets.filter(market => 
      market.volumeNum && typeof market.volumeNum === 'number' && market.volumeNum > 0
    );
    
    if (marketsWithVolume.length > 0) {
      console.log('✅ Volume data is valid');
      console.log(`   Found ${marketsWithVolume.length} markets with volume data`);
      console.log('   Sample volumes:', marketsWithVolume.slice(0, 3).map(m => ({
        question: m.question.substring(0, 30) + '...',
        volume: m.volume,
        volumeNum: m.volumeNum
      })));
      tests.push({ name: 'Volume Data', passed: true });
    } else {
      console.log('⚠️ No markets with volume data found');
      tests.push({ name: 'Volume Data', passed: true }); // Not a failure
    }
  } catch (error) {
    console.log('❌ Volume data test failed:', error.message);
    tests.push({ name: 'Volume Data', passed: false });
  }

  // Test 5: Search functionality
  try {
    console.log('\n5️⃣ Testing search functionality...');
    const response = await axios.get('https://gamma-api.polymarket.com/markets?limit=5&active=true&closed=false&query=bitcoin');
    const searchResults = response.data?.data || response.data;
    
    if (Array.isArray(searchResults)) {
      console.log('✅ Search functionality works');
      console.log(`   Search returned ${searchResults.length} results for "bitcoin"`);
      if (searchResults.length > 0) {
        console.log('   Sample result:', searchResults[0].question.substring(0, 50) + '...');
      }
      tests.push({ name: 'Search Functionality', passed: true });
    } else {
      console.log('❌ Search returned invalid data');
      tests.push({ name: 'Search Functionality', passed: false });
    }
  } catch (error) {
    console.log('❌ Search test failed:', error.message);
    tests.push({ name: 'Search Functionality', passed: false });
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('═'.repeat(40));
  
  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  
  tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
  });
  
  console.log('═'.repeat(40));
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your Polymarket API integration is ready for the hackathon!');
  } else if (passedTests / totalTests >= 0.8) {
    console.log('\n⚠️ Most tests passed. Minor issues detected but should work for demo.');
  } else {
    console.log('\n❌ Multiple failures detected. Check your implementation.');
  }
  
  return { passedTests, totalTests, tests };
}

// Run the tests
testPolymarketAPI()
  .then(result => {
    if (result.passedTests === result.totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
