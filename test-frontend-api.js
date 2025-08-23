#!/usr/bin/env node

/**
 * Test script to validate the frontend API routes work correctly
 * This simulates what the frontend will do when calling the internal API routes
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/polymarket';

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API Integration...\n');

  const tests = [];

  // Test 1: Markets endpoint
  try {
    console.log('1️⃣ Testing /api/polymarket/markets...');
    const response = await axios.get(`${API_BASE}/markets?limit=3`);
    
    if (response.data.success && response.data.data.length > 0) {
      console.log('✅ Markets API working');
      console.log(`   Retrieved ${response.data.count} markets`);
      console.log(`   Sample: ${response.data.data[0].question.substring(0, 50)}...`);
      tests.push({ name: 'Markets API', passed: true });
    } else {
      console.log('❌ Markets API failed - no data returned');
      tests.push({ name: 'Markets API', passed: false });
    }
  } catch (error) {
    console.log('❌ Markets API failed:', error.response?.status || error.message);
    tests.push({ name: 'Markets API', passed: false });
  }

  // Test 2: Search endpoint
  try {
    console.log('\n2️⃣ Testing /api/polymarket/search...');
    const response = await axios.get(`${API_BASE}/search?query=fed&limit=2`);
    
    if (response.data.success) {
      console.log('✅ Search API working');
      console.log(`   Search for "fed" returned ${response.data.count} results`);
      if (response.data.data.length > 0) {
        console.log(`   Sample: ${response.data.data[0].question.substring(0, 50)}...`);
      }
      tests.push({ name: 'Search API', passed: true });
    } else {
      console.log('❌ Search API failed');
      tests.push({ name: 'Search API', passed: false });
    }
  } catch (error) {
    console.log('❌ Search API failed:', error.response?.status || error.message);
    tests.push({ name: 'Search API', passed: false });
  }

  // Test 3: Featured endpoint
  try {
    console.log('\n3️⃣ Testing /api/polymarket/featured...');
    const response = await axios.get(`${API_BASE}/featured?limit=2`);
    
    if (response.data.success && response.data.data.length > 0) {
      console.log('✅ Featured API working');
      console.log(`   Retrieved ${response.data.count} featured markets`);
      console.log(`   Sample: ${response.data.data[0].question.substring(0, 50)}...`);
      tests.push({ name: 'Featured API', passed: true });
    } else {
      console.log('❌ Featured API failed - no data returned');
      tests.push({ name: 'Featured API', passed: false });
    }
  } catch (error) {
    console.log('❌ Featured API failed:', error.response?.status || error.message);
    tests.push({ name: 'Featured API', passed: false });
  }

  // Test 4: Data structure validation
  try {
    console.log('\n4️⃣ Testing data structure...');
    const response = await axios.get(`${API_BASE}/markets?limit=1`);
    
    if (response.data.success && response.data.data.length > 0) {
      const market = response.data.data[0];
      const requiredFields = ['conditionId', 'question', 'outcomePrices', 'volume'];
      const missingFields = requiredFields.filter(field => !market.hasOwnProperty(field));
      
      if (missingFields.length === 0) {
        console.log('✅ Data structure is valid');
        console.log('   All required fields present:', requiredFields.join(', '));
        tests.push({ name: 'Data Structure', passed: true });
      } else {
        console.log('❌ Missing required fields:', missingFields);
        tests.push({ name: 'Data Structure', passed: false });
      }
    } else {
      console.log('❌ No data to validate structure');
      tests.push({ name: 'Data Structure', passed: false });
    }
  } catch (error) {
    console.log('❌ Data structure test failed:', error.response?.status || error.message);
    tests.push({ name: 'Data Structure', passed: false });
  }

  // Summary
  console.log('\n📊 Frontend API Test Results');
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
    console.log('\n🎉 All frontend API tests passed! CORS issue is fixed!');
    console.log('\n✅ Your frontend should now be able to:');
    console.log('   • Load real Polymarket markets');
    console.log('   • Search for specific markets');
    console.log('   • Display featured/trending markets');
    console.log('   • Show real prices and volume data');
  } else if (passedTests / totalTests >= 0.75) {
    console.log('\n⚠️ Most tests passed but some issues detected.');
  } else {
    console.log('\n❌ Multiple failures detected. Check your Next.js server is running.');
  }
  
  return { passedTests, totalTests, tests };
}

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting Frontend API Test Suite...');
  console.log('📋 Make sure your Next.js server is running: npm run dev\n');
  
  testFrontendAPI()
    .then(result => {
      if (result.passedTests === result.totalTests) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error.message);
      console.log('\n💡 Make sure to start your server first: npm run dev');
      process.exit(1);
    });
}
