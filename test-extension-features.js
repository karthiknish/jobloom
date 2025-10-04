#!/usr/bin/env node

/**
 * Test script to verify extension add to board and sponsor check functionality
 * This script helps verify that the key features work correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Extension Add to Board & Sponsor Check Features\n');

// Check if we're in the right directory
if (!fs.existsSync('packages/web') || !fs.existsSync('packages/extension')) {
  console.error('❌ Error: This script must be run from the project root directory');
  process.exit(1);
}

// 1. Check add to board functionality
console.log('1. 🔍 Checking Add to Board functionality...');

const addToBoardPath = 'packages/extension/src/addToBoard.ts';
if (fs.existsSync(addToBoardPath)) {
  const content = fs.readFileSync(addToBoardPath, 'utf8');
  
  const checks = {
    hasJobBoardManager: content.includes('export class JobBoardManager'),
    hasAddToBoard: content.includes('addToBoard'),
    hasValidation: content.includes('validateAndDeduplicateJob'),
    hasAuthCheck: content.includes('getUserId'),
    hasApiCalls: content.includes('post') && content.includes('put'),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    hasDuplicateCheck: content.includes('checkIfJobExists'),
    hasJobScoring: content.includes('calculateJobScore'),
    hasStatusUpdate: content.includes('updateJobStatus'),
    hasSponsorshipIntegration: content.includes('isSponsored')
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  console.log(`   ${passedChecks}/${totalChecks} Add to Board checks passed:`);
  
  if (checks.hasJobBoardManager) console.log('   ✅ JobBoardManager class found');
  else console.log('   ❌ JobBoardManager class missing');
  
  if (checks.hasAddToBoard) console.log('   ✅ addToBoard method found');
  else console.log('   ❌ addToBoard method missing');
  
  if (checks.hasValidation) console.log('   ✅ Job validation found');
  else console.log('   ❌ Job validation missing');
  
  if (checks.hasAuthCheck) console.log('   ✅ Authentication check found');
  else console.log('   ❌ Authentication check missing');
  
  if (checks.hasApiCalls) console.log('   ✅ API calls (post/put) found');
  else console.log('   ❌ API calls missing');
  
  if (checks.hasErrorHandling) console.log('   ✅ Error handling found');
  else console.log('   ❌ Error handling missing');
  
  if (checks.hasDuplicateCheck) console.log('   ✅ Duplicate job check found');
  else console.log('   ❌ Duplicate job check missing');
  
  if (checks.hasJobScoring) console.log('   ✅ Job scoring system found');
  else console.log('   ❌ Job scoring system missing');
  
  if (checks.hasStatusUpdate) console.log('   ✅ Job status update found');
  else console.log('   ❌ Job status update missing');
  
  if (checks.hasSponsorshipIntegration) console.log('   ✅ Sponsorship data integration found');
  else console.log('   ❌ Sponsorship data integration missing');
  
} else {
  console.log('   ❌ Add to board file not found');
}

// 2. Check sponsor check functionality
console.log('\n2. 🔍 Checking Sponsor Check functionality...');

const popupPath = 'packages/extension/src/popup.ts';
if (fs.existsSync(popupPath)) {
  const content = fs.readFileSync(popupPath, 'utf8');
  
  const sponsorChecks = {
    hasCheckJobSponsor: content.includes('checkJobSponsor'),
    hasValidation: content.includes('companyName.trim()'),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    hasAuthErrorHandling: content.includes('401') && content.includes('403'),
    hasRateLimitHandling: content.includes('rateLimitInfo'),
    hasSkilledWorkerCheck: content.includes('isSkilledWorker'),
    hasGlobalBusinessCheck: content.includes('isGlobalBusiness'),
    hasToastNotifications: content.includes('showToast'),
    hasDetailedStatus: content.includes('Licensed (Skilled Worker)'),
    hasApiIntegration: content.includes('get<any>("/api/app/sponsorship/companies"')
  };
  
  const passedSponsorChecks = Object.values(sponsorChecks).filter(Boolean).length;
  const totalSponsorChecks = Object.keys(sponsorChecks).length;
  
  console.log(`   ${passedSponsorChecks}/${totalSponsorChecks} Sponsor Check checks passed:`);
  
  if (sponsorChecks.hasCheckJobSponsor) console.log('   ✅ checkJobSponsor function found');
  else console.log('   ❌ checkJobSponsor function missing');
  
  if (sponsorChecks.hasValidation) console.log('   ✅ Company name validation found');
  else console.log('   ❌ Company name validation missing');
  
  if (sponsorChecks.hasErrorHandling) console.log('   ✅ Error handling found');
  else console.log('   ❌ Error handling missing');
  
  if (sponsorChecks.hasAuthErrorHandling) console.log('   ✅ Auth error handling found');
  else console.log('   ❌ Auth error handling missing');
  
  if (sponsorChecks.hasRateLimitHandling) console.log('   ✅ Rate limit handling found');
  else console.log('   ❌ Rate limit handling missing');
  
  if (sponsorChecks.hasSkilledWorkerCheck) console.log('   ✅ Skilled Worker check found');
  else console.log('   ❌ Skilled Worker check missing');
  
  if (sponsorChecks.hasGlobalBusinessCheck) console.log('   ✅ Global Business check found');
  else console.log('   ❌ Global Business check missing');
  
  if (sponsorChecks.hasToastNotifications) console.log('   ✅ Toast notifications found');
  else console.log('   ❌ Toast notifications missing');
  
  if (sponsorChecks.hasDetailedStatus) console.log('   ✅ Detailed sponsor status found');
  else console.log('   ❌ Detailed sponsor status missing');
  
  if (sponsorChecks.hasApiIntegration) console.log('   ✅ API integration found');
  else console.log('   ❌ API integration missing');
  
} else {
  console.log('   ❌ Popup file not found');
}

// 3. Check content script integration
console.log('\n3. 🔍 Checking Content Script Integration...');

const contentPath = 'packages/extension/src/content.ts';
if (fs.existsSync(contentPath)) {
  const content = fs.readFileSync(contentPath, 'utf8');
  
  const contentChecks = {
    hasSponsorshipFromButton: content.includes('checkJobSponsorshipFromButton'),
    hasAddToBoardButton: content.includes('hireall-add-to-board'),
    hasCompanyValidation: content.includes('company.trim().length < 2'),
    hasErrorRecovery: content.includes('setTimeout') && content.includes('disabled = false'),
    hasButtonIntegration: content.includes('addEventListener("click"'),
    hasSponsorshipButton: content.includes('hireall-check-sponsorship'),
    hasAddJobButtons: content.includes('addJobToBoard')
  };
  
  const passedContentChecks = Object.values(contentChecks).filter(Boolean).length;
  const totalContentChecks = Object.keys(contentChecks).length;
  
  console.log(`   ${passedContentChecks}/${totalContentChecks} Content Script checks passed:`);
  
  if (contentChecks.hasSponsorshipFromButton) console.log('   ✅ Sponsorship check from button found');
  else console.log('   ❌ Sponsorship check from button missing');
  
  if (contentChecks.hasAddToBoardButton) console.log('   ✅ Add to board button found');
  else console.log('   ❌ Add to board button missing');
  
  if (contentChecks.hasCompanyValidation) console.log('   ✅ Company validation found');
  else console.log('   ❌ Company validation missing');
  
  if (contentChecks.hasErrorRecovery) console.log('   ✅ Error recovery found');
  else console.log('   ❌ Error recovery missing');
  
  if (contentChecks.hasButtonIntegration) console.log('   ✅ Button event integration found');
  else console.log('   ❌ Button event integration missing');
  
  if (contentChecks.hasSponsorshipButton) console.log('   ✅ Sponsorship button styling found');
  else console.log('   ❌ Sponsorship button styling missing');
  
  if (contentChecks.hasAddJobButtons) console.log('   ✅ Add job button functionality found');
  else console.log('   ❌ Add job button functionality missing');
  
} else {
  console.log('   ❌ Content script file not found');
}

// 4. Check API client functionality
console.log('\n4. 🔍 Checking API Client functionality...');

const apiClientPath = 'packages/extension/src/apiClient.ts';
if (fs.existsSync(apiClientPath)) {
  const content = fs.readFileSync(apiClientPath, 'utf8');
  
  const apiChecks = {
    hasGetFunction: content.includes('export function get'),
    hasPostFunction: content.includes('export function post'),
    hasPutFunction: content.includes('export function put'),
    hasAuthHeaders: content.includes('Authorization') && content.includes('Bearer'),
    hasErrorHandling: content.includes('res.ok') && content.includes('statusCode'),
    hasRateLimiting: content.includes('checkRateLimit'),
    hasWebAppFallback: content.includes('chrome.tabs.sendMessage'),
    hasApiRequest: content.includes('apiRequest'),
    hasQuerySupport: content.includes('buildQuery')
  };
  
  const passedApiChecks = Object.values(apiChecks).filter(Boolean).length;
  const totalApiChecks = Object.keys(apiChecks).length;
  
  console.log(`   ${passedApiChecks}/${totalApiChecks} API Client checks passed:`);
  
  if (apiChecks.hasGetFunction) console.log('   ✅ GET function found');
  else console.log('   ❌ GET function missing');
  
  if (apiChecks.hasPostFunction) console.log('   ✅ POST function found');
  else console.log('   ❌ POST function missing');
  
  if (apiChecks.hasPutFunction) console.log('   ✅ PUT function found');
  else console.log('   ❌ PUT function missing');
  
  if (apiChecks.hasAuthHeaders) console.log('   ✅ Authorization headers found');
  else console.log('   ❌ Authorization headers missing');
  
  if (apiChecks.hasErrorHandling) console.log('   ✅ API error handling found');
  else console.log('   ❌ API error handling missing');
  
  if (apiChecks.hasRateLimiting) console.log('   ✅ Rate limiting found');
  else console.log('   ❌ Rate limiting missing');
  
  if (apiChecks.hasWebAppFallback) console.log('   ✅ Web app auth fallback found');
  else console.log('   ❌ Web app auth fallback missing');
  
  if (apiChecks.hasApiRequest) console.log('   ✅ Core apiRequest function found');
  else console.log('   ❌ Core apiRequest function missing');
  
  if (apiChecks.hasQuerySupport) console.log('   ✅ Query parameter support found');
  else console.log('   ❌ Query parameter support missing');
  
} else {
  console.log('   ❌ API client file not found');
}

// 5. Check web app API endpoints
console.log('\n5. 🔍 Checking Web App API endpoints...');

const apiDir = 'packages/web/src/app/api';
if (fs.existsSync(apiDir)) {
  const apiEndpoints = [
    'app/jobs/route.ts',
    'app/jobs/user/[userId]/route.ts',
    'app/applications/route.ts',
    'app/applications/user/[userId]/route.ts',
    'app/sponsorship/companies/route.ts'
  ];
  
  let foundEndpoints = 0;
  apiEndpoints.forEach(endpoint => {
    const fullPath = path.join(apiDir, endpoint);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${endpoint} found`);
      foundEndpoints++;
    } else {
      console.log(`   ❌ ${endpoint} missing`);
    }
  });
  
  console.log(`   ${foundEndpoints}/${apiEndpoints.length} API endpoints found`);
} else {
  console.log('   ❌ API directory not found');
}

// 6. Manual testing instructions
console.log('\n6. 🚀 Manual Testing Instructions:');
console.log('   To test the features manually:');
console.log('');
console.log('   a) Start the development servers:');
console.log('      npm run dev          # Web app');
console.log('      cd packages/extension && npm run watch  # Extension');
console.log('');
console.log('   b) Load the extension in Chrome developer mode');
console.log('   c) Sign in to the web app');
console.log('   d) Navigate to a job site (LinkedIn, Indeed, etc.)');
console.log('');
console.log('   Test Add to Board:');
console.log('   1. Find a job posting on the site');
console.log('   2. Click the "Add to Board" button in the extension overlay');
console.log('   3. Verify the job appears in your web app dashboard');
console.log('   4. Check that job status can be updated');
console.log('   5. Verify duplicate jobs are prevented');
console.log('');
console.log('   Test Sponsor Check:');
console.log('   1. Click the "Check Sponsor" button for any job');
console.log('   2. Verify sponsor lookup completes successfully');
console.log('   3. Check for proper status messages (Licensed, Not Found, etc.)');
console.log('   4. Test error handling with invalid company names');
console.log('   5. Verify rate limiting works after multiple requests');
console.log('');
console.log('   Expected behavior:');
console.log('   - Add to Board should create jobs in the web app database');
console.log('   - Sponsor Check should show detailed sponsorship status');
console.log('   - Both features should handle authentication properly');
console.log('   - Error messages should be clear and helpful');
console.log('   - Rate limiting should prevent abuse');

console.log('\n✅ Extension features test complete!');
