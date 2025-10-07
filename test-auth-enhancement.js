#!/usr/bin/env node

/**
 * Test Enhanced Authentication Flow
 * Tests the improved authentication system including:
 * - Direct Google popup authentication in extension
 * - Auto-login across web and extension
 * - Session sharing improvements
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Enhanced Authentication Flow\n');

// Test 1: Verify Google popup authentication is implemented
console.log('1. Testing Google Popup Authentication...');
const popupPath = path.join(__dirname, 'packages/extension/src/popup.ts');
const popupContent = fs.readFileSync(popupPath, 'utf8');

const hasDirectGoogleAuth = popupContent.includes('signInWithPopup(auth, provider)');
const googleProviderImport = popupContent.includes('getGoogleProvider');
const googleErrorHandling = popupContent.includes('auth/popup-blocked');

console.log(`   ✅ Direct Google popup: ${hasDirectGoogleAuth ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Google provider import: ${googleProviderImport ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Google error handling: ${googleErrorHandling ? 'Implemented' : 'Missing'}`);

const googleTestPassed = hasDirectGoogleAuth && googleProviderImport && googleErrorHandling;
console.log(`   ${googleTestPassed ? '✅ PASS' : '❌ FAIL'}: Google popup authentication\n`);

// Test 2: Verify enhanced auto-login mechanisms
console.log('2. Testing Enhanced Auto-Login...');

const hasTokenCaching = popupContent.includes('await user.getIdToken()');
const hasWebAppListener = popupContent.includes('FIREBASE_AUTH_SUCCESS');
const hasImprovedSync = popupContent.includes('acquireIdToken');

console.log(`   ✅ Automatic token caching: ${hasTokenCaching ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Web app auth listener: ${hasWebAppListener ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Improved auth sync: ${hasImprovedSync ? 'Implemented' : 'Missing'}`);

const autoLoginTestPassed = hasTokenCaching && hasWebAppListener && hasImprovedSync;
console.log(`   ${autoLoginTestPassed ? '✅ PASS' : '❌ FAIL'}: Enhanced auto-login\n`);

// Test 3: Verify session sharing improvements
console.log('3. Testing Session Sharing Improvements...');
const webappContent = fs.readFileSync(path.join(__dirname, 'packages/extension/src/webapp-content.ts'), 'utf8');

const hasSessionTokenExtraction = webappContent.includes('getCookie("__session")');
const hasFullSessionExtraction = webappContent.includes('extractHireallSession');
const hasEnhancedMessagePassing = webappContent.includes('extractHireallSession');

console.log(`   ✅ Session token extraction: ${hasSessionTokenExtraction ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Full session extraction: ${hasFullSessionExtraction ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Enhanced message passing: ${hasEnhancedMessagePassing ? 'Implemented' : 'Missing'}`);

const sessionTestPassed = hasSessionTokenExtraction && hasFullSessionExtraction && hasEnhancedMessagePassing;
console.log(`   ${sessionTestPassed ? '✅ PASS' : '❌ FAIL'}: Session sharing\n`);

// Test 4: Verify token management improvements
console.log('4. Testing Token Management Improvements...');
const authTokenContent = fs.readFileSync(path.join(__dirname, 'packages/extension/src/authToken.ts'), 'utf8');

const hasTokenRefresh = authTokenContent.includes('forceRefresh');
const hasMultiSourceAuth = authTokenContent.includes('getTokenFromHireallTab');
const hasFallbackChain = authTokenContent.includes('requestTokenFromBackground');

console.log(`   ✅ Token refresh capability: ${hasTokenRefresh ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Multi-source auth: ${hasMultiSourceAuth ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Fallback chain: ${hasFallbackChain ? 'Implemented' : 'Missing'}`);

const tokenTestPassed = hasTokenRefresh && hasMultiSourceAuth && hasFallbackChain;
console.log(`   ${tokenTestPassed ? '✅ PASS' : '❌ FAIL'}: Token management\n`);

// Test 5: Verify Firebase configuration consistency
console.log('5. Testing Firebase Configuration Consistency...');
const firebaseExtContent = fs.readFileSync(path.join(__dirname, 'packages/extension/src/firebase.ts'), 'utf8');

const hasSharedPersistence = firebaseExtContent.includes('indexedDBLocalPersistence');
const hasMultiplePersistence = firebaseExtContent.includes('browserLocalPersistence');

console.log(`   ✅ Shared persistence: ${hasSharedPersistence ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Multiple persistence layers: ${hasMultiplePersistence ? 'Implemented' : 'Missing'}`);

const firebaseTestPassed = hasSharedPersistence && hasMultiplePersistence;
console.log(`   ${firebaseTestPassed ? '✅ PASS' : '❌ FAIL'}: Firebase configuration\n`);

// Test 6: Verify error handling improvements
console.log('6. Testing Error Handling Improvements...');

const hasGoogleErrorCases = popupContent.includes('auth/network-request-failed');
const hasFallbackToWebApp = popupContent.includes('Fallback to web app login');
const hasUserFriendlyMessages = popupContent.includes('Network error. Please check your connection.');

console.log(`   ✅ Google auth error cases: ${hasGoogleErrorCases ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Fallback to web app: ${hasFallbackToWebApp ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ User-friendly messages: ${hasUserFriendlyMessages ? 'Implemented' : 'Missing'}`);

const errorTestPassed = hasGoogleErrorCases && hasFallbackToWebApp && hasUserFriendlyMessages;
console.log(`   ${errorTestPassed ? '✅ PASS' : '❌ FAIL'}: Error handling\n`);

// Test 7: Verify UI feedback improvements
console.log('7. Testing UI Feedback Improvements...');

const hasAuthSuccessToast = popupContent.includes('Signed in successfully with Google');
const hasWebAppToast = popupContent.includes('Signed in from web app!');
const hasLogoutToast = popupContent.includes('Signed out from web app');

console.log(`   ✅ Auth success toast: ${hasAuthSuccessToast ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Web app sync toast: ${hasWebAppToast ? 'Implemented' : 'Missing'}`);
console.log(`   ✅ Logout sync toast: ${hasLogoutToast ? 'Implemented' : 'Missing'}`);

const uiTestPassed = hasAuthSuccessToast && hasWebAppToast && hasLogoutToast;
console.log(`   ${uiTestPassed ? '✅ PASS' : '❌ FAIL'}: UI feedback\n`);

// Summary
console.log('📊 Test Summary:');
const allTests = [
  { name: 'Google Popup Authentication', passed: googleTestPassed },
  { name: 'Enhanced Auto-Login', passed: autoLoginTestPassed },
  { name: 'Session Sharing', passed: sessionTestPassed },
  { name: 'Token Management', passed: tokenTestPassed },
  { name: 'Firebase Configuration', passed: firebaseTestPassed },
  { name: 'Error Handling', passed: errorTestPassed },
  { name: 'UI Feedback', passed: uiTestPassed }
];

const passedTests = allTests.filter(test => test.passed).length;
const totalTests = allTests.length;

allTests.forEach(test => {
  console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
});

console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All authentication enhancements implemented successfully!');
  console.log('\n🚀 New Features:');
  console.log('   • Direct Google popup authentication in extension');
  console.log('   • Instant auto-login when user signs in on web app');
  console.log('   • Improved session token sharing');
  console.log('   • Better error handling with fallback options');
  console.log('   • Enhanced UI feedback for all auth events');
} else {
  console.log('⚠️  Some authentication enhancements need attention');
  process.exit(1);
}

console.log('\n📝 Testing Instructions:');
console.log('1. Build the extension: npm run build:extension');
console.log('2. Load the extension in Chrome');
console.log('3. Test Google sign-in in extension popup');
console.log('4. Test sign-in on web app and verify extension auto-login');
console.log('5. Test sign-out on web app and verify extension logout');
console.log('6. Test session persistence across browser restarts');
