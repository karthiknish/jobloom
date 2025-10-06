#!/usr/bin/env node

/**
 * Test script to verify CORS fixes for the extension API
 */

console.log('🔍 Testing CORS Fix for HireAll Extension API...\n');

// Test 1: Check if the modified files exist and have CORS headers
console.log('1. Verifying CORS modifications...');

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'packages/web/src/middleware.ts',
  'packages/web/src/app/api/app/sponsorship/companies/route.ts',
  'packages/web/src/app/api/soc-codes/authenticated/route.ts'
];

let allFilesHaveCORS = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasCORS = content.includes('Access-Control-Allow-Origin') && 
                   content.includes('linkedin.com') &&
                   content.includes('OPTIONS');
    
    if (hasCORS) {
      console.log(`✅ ${file} - CORS headers added`);
    } else {
      console.log(`❌ ${file} - CORS headers missing`);
      allFilesHaveCORS = false;
    }
  } else {
    console.log(`❌ ${file} - File not found`);
    allFilesHaveCORS = false;
  }
});

// Test 2: Check if middleware allows LinkedIn origins
console.log('\n2. Checking LinkedIn origin handling...');
try {
  const middlewareContent = fs.readFileSync('packages/web/src/middleware.ts', 'utf8');
  const hasLinkedInOrigin = middlewareContent.includes('https://www.linkedin.com') &&
                           middlewareContent.includes('https://linkedin.com');
  
  if (hasLinkedInOrigin) {
    console.log('✅ LinkedIn origins allowed in middleware');
  } else {
    console.log('❌ LinkedIn origins not found in middleware');
    allFilesHaveCORS = false;
  }
} catch (error) {
  console.log('❌ Failed to check middleware:', error.message);
  allFilesHaveCORS = false;
}

// Test 3: Check if OPTIONS handlers are added
console.log('\n3. Checking OPTIONS handlers for CORS preflight...');
const apiFiles = [
  'packages/web/src/app/api/app/sponsorship/companies/route.ts',
  'packages/web/src/app/api/soc-codes/authenticated/route.ts'
];

apiFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasOptionsHandler = content.includes('export async function OPTIONS');
    
    if (hasOptionsHandler) {
      console.log(`✅ ${path.basename(file)} - OPTIONS handler added`);
    } else {
      console.log(`❌ ${path.basename(file)} - OPTIONS handler missing`);
      allFilesHaveCORS = false;
    }
  } catch (error) {
    console.log(`❌ Failed to check ${file}:`, error.message);
    allFilesHaveCORS = false;
  }
});

// Test 4: Check if CORS helper functions are properly implemented
console.log('\n4. Checking CORS helper functions...');
apiFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasCorsHelper = content.includes('function addCorsHeaders') &&
                         content.includes('Access-Control-Allow-Credentials');
    
    if (hasCorsHelper) {
      console.log(`✅ ${path.basename(file)} - CORS helper function implemented`);
    } else {
      console.log(`❌ ${path.basename(file)} - CORS helper function missing`);
      allFilesHaveCORS = false;
    }
  } catch (error) {
    console.log(`❌ Failed to check ${file}:`, error.message);
    allFilesHaveCORS = false;
  }
});

if (allFilesHaveCORS) {
  console.log('\n🎉 CORS Fix Implementation Complete!');
  console.log('\n📋 Changes made:');
  console.log('1. ✅ Updated global middleware to allow LinkedIn origins');
  console.log('2. ✅ Added CORS headers to sponsorship companies API');
  console.log('3. ✅ Added CORS headers to SOC codes authenticated API');
  console.log('4. ✅ Added OPTIONS handlers for CORS preflight requests');
  console.log('5. ✅ Implemented proper CORS helper functions');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy the updated API to production');
  console.log('2. Test the extension on LinkedIn jobs pages');
  console.log('3. Verify sponsor check functionality works');
  console.log('4. Monitor browser console for any remaining CORS errors');
  
  console.log('\n🔧 Allowed Origins:');
  console.log('- https://www.linkedin.com');
  console.log('- https://linkedin.com');
  console.log('- https://hireall.app (and subdomains)');
  console.log('- http://localhost:3000 (development)');
  
  console.log('\n📝 Test Commands:');
  console.log('curl -H "Origin: https://www.linkedin.com" \\');
  console.log('     -H "Access-Control-Request-Method: GET" \\');
  console.log('     -H "Access-Control-Request-Headers: authorization" \\');
  console.log('     -X OPTIONS https://your-api-domain.com/api/app/sponsorship/companies');
} else {
  console.log('\n❌ CORS Fix Incomplete - some issues detected');
  console.log('Please review the errors above and fix them before deploying.');
}
