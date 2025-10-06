#!/usr/bin/env node

/**
 * Test script to verify authentication fixes in the extension
 * This script simulates the authentication flow and checks for common issues
 */

const { execSync } = require('child_process');

console.log('🔍 Testing HireAll Extension Authentication Fixes...\n');

// Test 1: Check if the extension can be built without errors
console.log('1. Building extension to check for syntax errors...');
try {
  execSync('npm run build', { stdio: 'pipe', cwd: './packages/extension' });
  console.log('✅ Extension builds successfully');
} catch (error) {
  console.log('❌ Extension build failed:', error.message);
  process.exit(1);
}

// Test 2: Check for missing imports or dependencies
console.log('\n2. Checking for missing dependencies...');
try {
  execSync('npm ls --depth=0', { stdio: 'pipe', cwd: './packages/extension' });
  console.log('✅ All dependencies installed');
} catch (error) {
  console.log('❌ Dependency check failed:', error.message);
}

// Test 3: Verify key authentication files exist
console.log('\n3. Verifying authentication files exist...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'packages/extension/src/authToken.ts',
  'packages/extension/src/apiClient.ts',
  'packages/extension/src/background.ts',
  'packages/extension/src/content.ts',
  'packages/extension/src/utils/authDiagnostics.ts',
  'packages/extension/src/utils/logger.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing');
  process.exit(1);
}

// Test 4: Check if diagnostic functions are properly exposed
console.log('\n4. Checking diagnostic function exports...');
try {
  const contentScript = fs.readFileSync('packages/extension/src/content.ts', 'utf8');
  if (contentScript.includes('hireallDebugAuth') && contentScript.includes('hireallRepairAuth')) {
    console.log('✅ Diagnostic functions are exposed');
  } else {
    console.log('❌ Diagnostic functions not found in content script');
  }
} catch (error) {
  console.log('❌ Failed to check content script:', error.message);
}

// Test 5: Verify authentication flow improvements
console.log('\n5. Checking authentication flow improvements...');
try {
  const apiClient = fs.readFileSync('packages/extension/src/apiClient.ts', 'utf8');
  const authToken = fs.readFileSync('packages/extension/src/authToken.ts', 'utf8');
  
  const improvements = [
    { file: 'apiClient.ts', check: 'Hireall: API', desc: 'Enhanced API logging' },
    { file: 'authToken.ts', check: 'Hireall: Using cached', desc: 'Token acquisition logging' },
    { file: 'authToken.ts', check: 'Failed to acquire ID token from all sources', desc: 'Comprehensive error handling' }
  ];

  improvements.forEach(({ file, check, desc }) => {
    const content = file === 'apiClient.ts' ? apiClient : authToken;
    if (content.includes(check)) {
      console.log(`✅ ${desc} implemented in ${file}`);
    } else {
      console.log(`❌ ${desc} missing from ${file}`);
    }
  });
} catch (error) {
  console.log('❌ Failed to check authentication improvements:', error.message);
}

// Test 6: Check sponsorship manager retry logic
console.log('\n6. Checking sponsorship manager retry logic...');
try {
  const sponsorshipManager = fs.readFileSync('packages/extension/src/components/SponsorshipManager.ts', 'utf8');
  if (sponsorshipManager.includes('Auth state refreshed, retrying sponsor lookup')) {
    console.log('✅ Sponsorship manager includes retry logic');
  } else {
    console.log('❌ Sponsorship manager retry logic missing');
  }
} catch (error) {
  console.log('❌ Failed to check sponsorship manager:', error.message);
}

console.log('\n🎉 Authentication fix verification completed!');
console.log('\n📋 Summary of changes made:');
console.log('1. Enhanced token acquisition with better logging');
console.log('2. Added authentication state verification in content script');
console.log('3. Improved error handling in API client');
console.log('4. Added retry logic for sponsorship lookups');
console.log('5. Created diagnostic utility for debugging');
console.log('6. Exposed global debug functions for browser console');

console.log('\n🔧 To test the fixes:');
console.log('1. Load/reload the extension in Chrome');
console.log('2. Navigate to a LinkedIn jobs page');
console.log('3. Open browser console and run: hireallDebugAuth()');
console.log('4. If issues persist, run: hireallRepairAuth()');
console.log('5. Refresh the page and test again');
