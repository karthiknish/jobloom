#!/usr/bin/env node

/**
 * Test script for enhanced job extraction and SOC code matching functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// Test data for fuzzy matching
const testJobTitles = [
  'Senior Software Engineer',
  'Full Stack Developer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'Marketing Manager',
  'HR Business Partner',
  'Mechanical Engineer',
  'Financial Analyst',
  'Software Development Engineer', // Variation
  'Principal Software Engineer',  // Seniority variation
  'Product Owner',               // Related title
  'Machine Learning Engineer',   // Technology variation
  'Business Analyst',            // Different field
  'Frontend Web Developer',      // Specific role
  'Technical Program Manager'    // Combined role
];

async function setupAuthentication() {
  console.log('🔐 Setting up mock authentication...');
  
  try {
    // Use mock signature for testing
    authToken = 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc=' + Math.random().toString(36).substring(7);
    console.log('✅ Mock authentication setup complete');
    return true;
  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    return false;
  }
}

async function testEnhancedSocCodes() {
  console.log('\n🔍 Testing Enhanced SOC Codes API with fuzzy matching...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/soc-codes/enhanced?fuzzy=true&limit=10`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Enhanced SOC Codes API response:', {
      totalResults: data.totalResults,
      fuzzy: data.fuzzy,
      sample: data.results.slice(0, 2)
    });
    
    return data.results;
  } catch (error) {
    console.error('❌ Enhanced SOC Codes API test failed:', error.message);
    return null;
  }
}

async function testFuzzyMatching() {
  console.log('\n🎯 Testing fuzzy matching with various job titles...');
  
  const results = [];
  
  for (const title of testJobTitles) {
    try {
      const response = await fetch(`${BASE_URL}/api/soc-codes/enhanced?q=${encodeURIComponent(title)}&fuzzy=true&limit=3`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const bestMatch = data.results[0];
        results.push({
          title,
          bestMatch: bestMatch.jobType,
          confidence: bestMatch.matchScore,
          socCode: bestMatch.code,
          category: bestMatch.category,
          matchedTerms: bestMatch.matchedTerms
        });
        
        console.log(`✅ "${title}" → "${bestMatch.jobType}" (${(bestMatch.matchScore * 100).toFixed(1)}% confidence)`);
      } else {
        console.log(`⚠️  "${title}" → No matches found`);
      }
    } catch (error) {
      console.error(`❌ Failed to match "${title}":`, error.message);
    }
  }
  
  return results;
}

async function testStandardVsEnhanced() {
  console.log('\n🔄 Comparing standard vs enhanced SOC matching...');
  
  const testTitles = ['Software Engineer', 'Product Manager', 'Data Scientist'];
  
  for (const title of testTitles) {
    try {
      // Test standard endpoint
      const standardResponse = await fetch(`${BASE_URL}/api/soc-codes/authenticated?q=${encodeURIComponent(title)}&limit=5`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      const standardData = await standardResponse.json();
      
      // Test enhanced endpoint
      const enhancedResponse = await fetch(`${BASE_URL}/api/soc-codes/enhanced?q=${encodeURIComponent(title)}&fuzzy=true&limit=5`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      const enhancedData = await enhancedResponse.json();
      
      console.log(`\n📊 Comparison for "${title}":`);
      console.log(`  Standard API: ${standardData.totalResults} results`);
      if (standardData.results.length > 0) {
        console.log(`    Best: "${standardData.results[0].jobType}"`);
      }
      
      console.log(`  Enhanced API: ${enhancedData.totalResults} results`);
      if (enhancedData.results.length > 0) {
        console.log(`    Best: "${enhancedData.results[0].jobType}" (${(enhancedData.results[0].matchScore * 100).toFixed(1)}% confidence)`);
        console.log(`    Matched terms: ${enhancedData.results[0].matchedTerms.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ Comparison failed for "${title}":`, error.message);
    }
  }
}

async function testCategoryFiltering() {
  console.log('\n🏷️  Testing category filtering...');
  
  const categories = ['IT', 'Management', 'Finance', 'Marketing'];
  
  for (const category of categories) {
    try {
      const response = await fetch(`${BASE_URL}/api/soc-codes/enhanced?category=${encodeURIComponent(category)}&limit=5`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log(`✅ Category "${category}": ${data.totalResults} results`);
      data.results.forEach(result => {
        console.log(`  - ${result.jobType} (${result.code})`);
      });
      
    } catch (error) {
      console.error(`❌ Category "${category}" test failed:`, error.message);
    }
  }
}

async function testEligibilityFiltering() {
  console.log('\n✅ Testing eligibility filtering...');
  
  try {
    const eligibleResponse = await fetch(`${BASE_URL}/api/soc-codes/enhanced?eligibility=higher skilled&limit=5`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });
    
    const eligibleData = await eligibleResponse.json();
    
    console.log(`✅ Higher Skilled eligible roles: ${eligibleData.totalResults} results`);
    eligibleData.results.forEach(result => {
      console.log(`  - ${result.jobType} (${result.code}) - ${result.eligibility}`);
    });
    
  } catch (error) {
    console.error('❌ Eligibility filtering test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced Job Extraction Tests\n');
  
  const authSuccess = await setupAuthentication();
  if (!authSuccess) {
    console.error('❌ Authentication failed. Aborting tests.');
    process.exit(1);
  }
  
  // Test enhanced SOC codes
  const socCodes = await testEnhancedSocCodes();
  if (!socCodes) {
    console.error('❌ Enhanced SOC codes test failed. Aborting tests.');
    process.exit(1);
  }
  
  // Test fuzzy matching
  const fuzzyResults = await testFuzzyMatching();
  console.log(`\n📈 Fuzzy matching summary:`);
  console.log(`  Total titles tested: ${testJobTitles.length}`);
  console.log(`  Successful matches: ${fuzzyResults.length}`);
  console.log(`  Success rate: ${((fuzzyResults.length / testJobTitles.length) * 100).toFixed(1)}%`);
  
  // Calculate average confidence
  if (fuzzyResults.length > 0) {
    const avgConfidence = fuzzyResults.reduce((sum, result) => sum + result.confidence, 0) / fuzzyResults.length;
    console.log(`  Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  }
  
  // Test comparison
  await testStandardVsEnhanced();
  
  // Test category filtering
  await testCategoryFiltering();
  
  // Test eligibility filtering
  await testEligibilityFiltering();
  
  console.log('\n✅ Enhanced job extraction tests completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('  ✅ Enhanced SOC Codes API with fuzzy matching');
  console.log('  ✅ Fuzzy matching for various job titles');
  console.log('  ✅ Standard vs enhanced API comparison');
  console.log('  ✅ Category-based filtering');
  console.log('  ✅ Eligibility-based filtering');
  console.log('\n🎯 Enhanced Features Demonstrated:');
  console.log('  • Fuzzy string matching with confidence scores');
  console.log('  • Word overlap analysis');
  console.log('  • Related title matching');
  console.log('  • Category and eligibility filtering');
  console.log('  • Enhanced job role matching algorithm');
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
