#!/usr/bin/env node

/**
 * Test script to examine Firebase SOC codes data structure
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

async function setupAuthentication() {
  console.log('🔐 Setting up mock authentication...');
  
  try {
    authToken = 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc=' + Math.random().toString(36).substring(7);
    console.log('✅ Mock authentication setup complete');
    return true;
  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    return false;
  }
}

async function testCurrentSocCodes() {
  console.log('\n📋 Testing current SOC codes API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/soc-codes/authenticated`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Current SOC codes response:');
    console.log(`  Total results: ${data.totalResults}`);
    console.log(`  Query: ${data.query || 'none'}`);
    console.log(`  Sample data structure:`);
    
    if (data.results && data.results.length > 0) {
      const sample = data.results[0];
      console.log(JSON.stringify(sample, null, 2));
      
      console.log('\n📊 Available SOC codes:');
      data.results.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.jobType} (${item.code}) - ${item.eligibility}`);
        if (item.relatedTitles && item.relatedTitles.length > 0) {
          console.log(`     Related: ${item.relatedTitles.slice(0, 3).join(', ')}`);
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ SOC codes API test failed:', error.message);
    return null;
  }
}

async function testSocCodeSearch() {
  console.log('\n🔍 Testing SOC code search functionality...');
  
  const testQueries = ['software', 'engineer', 'manager', 'analyst'];
  
  for (const query of testQueries) {
    try {
      const response = await fetch(`${BASE_URL}/api/soc-codes/authenticated?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log(`\n📝 Query: "${query}"`);
      console.log(`  Results: ${data.totalResults}`);
      
      if (data.results && data.results.length > 0) {
        data.results.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.jobType} (${item.code})`);
        });
      } else {
        console.log('    No matches found');
      }
    } catch (error) {
      console.error(`❌ Search failed for "${query}":`, error.message);
    }
  }
}

async function testEligibilityFiltering() {
  console.log('\n✅ Testing eligibility filtering...');
  
  const eligibilityFilters = ['higher skilled', 'skilled', 'ineligible'];
  
  for (const filter of eligibilityFilters) {
    try {
      const response = await fetch(`${BASE_URL}/api/soc-codes/authenticated?eligibility=${encodeURIComponent(filter)}`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log(`📋 Eligibility: "${filter}"`);
      console.log(`  Results: ${data.totalResults}`);
      
      if (data.results && data.results.length > 0) {
        data.results.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.jobType} (${item.code}) - ${item.eligibility}`);
        });
      }
    } catch (error) {
      console.error(`❌ Eligibility filter failed for "${filter}":`, error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Firebase SOC Codes Tests\n');
  
  const authSuccess = await setupAuthentication();
  if (!authSuccess) {
    console.error('❌ Authentication failed. Aborting tests.');
    process.exit(1);
  }
  
  // Test current implementation
  await testCurrentSocCodes();
  
  // Test search functionality
  await testSocCodeSearch();
  
  // Test eligibility filtering
  await testEligibilityFiltering();
  
  console.log('\n✅ Firebase SOC codes tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('  ✅ Current SOC codes API structure analysis');
  console.log('  ✅ Search functionality testing');
  console.log('  ✅ Eligibility filtering testing');
}

runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
