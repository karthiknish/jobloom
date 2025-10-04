#!/usr/bin/env node

/**
 * Test script to verify extension-web app authentication integration
 * This script helps verify that the authentication flow works correctly
 * between the Chrome extension and the web app.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Testing Extension-Web App Authentication Integration\n');

// Check if we're in the right directory
if (!fs.existsSync('packages/web') || !fs.existsSync('packages/extension')) {
  console.error('❌ Error: This script must be run from the project root directory');
  process.exit(1);
}

// 1. Check Firebase configuration
console.log('1. 🔍 Checking Firebase configuration...');
const webEnvPath = 'packages/web/.env.local';
const extensionEnvPath = 'packages/extension/.env';

if (fs.existsSync(webEnvPath)) {
  const webEnv = fs.readFileSync(webEnvPath, 'utf8');
  const requiredVars = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!webEnv.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`   ⚠️  Missing Firebase config in web app: ${missingVars.join(', ')}`);
  } else {
    console.log('   ✅ Web app Firebase configuration found');
  }
} else {
  console.log('   ⚠️  Web app .env.local file not found');
}

if (fs.existsSync(extensionEnvPath)) {
  const extensionEnv = fs.readFileSync(extensionEnvPath, 'utf8');
  const requiredVars = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!extensionEnv.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`   ⚠️  Missing Firebase config in extension: ${missingVars.join(', ')}`);
  } else {
    console.log('   ✅ Extension Firebase configuration found');
  }
} else {
  console.log('   ⚠️  Extension .env file not found');
}

// 2. Check authentication integration points
console.log('\n2. 🔍 Checking authentication integration points...');

// Check webapp-content.ts
const webappContentPath = 'packages/extension/src/webapp-content.ts';
if (fs.existsSync(webappContentPath)) {
  const content = fs.readFileSync(webappContentPath, 'utf8');
  const hasGetUserId = content.includes('request.action === "getUserId"');
  const hasGetAuthToken = content.includes('request.action === "getAuthToken"');
  const hasFirebaseUserCheck = content.includes('__firebase_user?.id');
  
  if (hasGetUserId && hasGetAuthToken && hasFirebaseUserCheck) {
    console.log('   ✅ Extension content script has auth message handlers');
  } else {
    console.log('   ⚠️  Extension content script missing some auth handlers');
  }
} else {
  console.log('   ❌ Extension content script not found');
}

// Check firebase-auth-provider.tsx
const authProviderPath = 'packages/web/src/providers/firebase-auth-provider.tsx';
if (fs.existsSync(authProviderPath)) {
  const content = fs.readFileSync(authProviderPath, 'utf8');
  const hasSyncAuthState = content.includes('syncAuthStateToClient');
  const hasFirebaseUser = content.includes('__firebase_user');
  const hasFirebaseAuth = content.includes('__firebase_auth');
  
  if (hasSyncAuthState && hasFirebaseUser && hasFirebaseAuth) {
    console.log('   ✅ Web app auth provider has extension integration');
  } else {
    console.log('   ⚠️  Web app auth provider missing some extension integration');
  }
} else {
  console.log('   ❌ Web app auth provider not found');
}

// Check ExtensionIntegration component
const extensionIntegrationPath = 'packages/web/src/components/dashboard/ExtensionIntegration.tsx';
if (fs.existsSync(extensionIntegrationPath)) {
  const content = fs.readFileSync(extensionIntegrationPath, 'utf8');
  const hasAuthSync = content.includes('JOBOOK_USER_AUTH');
  const hasFirebaseUserSet = content.includes('__firebase_user');
  
  if (hasAuthSync && hasFirebaseUserSet) {
    console.log('   ✅ ExtensionIntegration component has auth sync');
  } else {
    console.log('   ⚠️  ExtensionIntegration component missing auth sync');
  }
} else {
  console.log('   ❌ ExtensionIntegration component not found');
}

// 3. Check API client authentication
console.log('\n3. 🔍 Checking API client authentication...');
const apiClientPath = 'packages/extension/src/apiClient.ts';
if (fs.existsSync(apiClientPath)) {
  const content = fs.readFileSync(apiClientPath, 'utf8');
  const hasGetIdToken = content.includes('getIdToken');
  const hasBearerToken = content.includes('Authorization');
  const hasWebAppFallback = content.includes('getAuthToken');
  
  if (hasGetIdToken && hasBearerToken && hasWebAppFallback) {
    console.log('   ✅ Extension API client has authentication with web app fallback');
  } else {
    console.log('   ⚠️  Extension API client missing some authentication features');
  }
} else {
  console.log('   ❌ Extension API client not found');
}

// 4. Test middleware authentication
console.log('\n4. 🔍 Checking middleware authentication...');
const middlewarePath = 'packages/web/src/middleware.ts';
if (fs.existsSync(middlewarePath)) {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  const hasFirebaseCookie = content.includes('__firebase_user');
  const hasAuthHeader = content.includes('Authorization');
  const hasProtectedRoutes = content.includes('protectedRoutes');
  
  if (hasFirebaseCookie && hasAuthHeader && hasProtectedRoutes) {
    console.log('   ✅ Middleware handles both cookie and header authentication');
  } else {
    console.log('   ⚠️  Middleware missing some authentication methods');
  }
} else {
  console.log('   ❌ Middleware not found');
}

// 5. Provide testing instructions
console.log('\n5. 🚀 Manual Testing Instructions:');
console.log('   To test the authentication flow manually:');
console.log('');
console.log('   a) Start the development servers:');
console.log('      npm run dev          # Web app');
console.log('      cd packages/extension && npm run watch  # Extension');
console.log('');
console.log('   b) Load the extension in Chrome developer mode');
console.log('   c) Sign in to the web app using Google or email/password');
console.log('   d) Navigate to a job site (LinkedIn, Indeed, etc.)');
console.log('   e) Check that the extension shows you as authenticated');
console.log('   f) Try using extension features (job detection, sponsor lookup)');
console.log('');
console.log('   Expected behavior:');
console.log('   - Extension popup should show "Signed in" status');
console.log('   - Job features should work without additional authentication');
console.log('   - API calls should include proper Bearer tokens');
console.log('   - Extension and web app should stay in sync');

console.log('\n✅ Authentication integration check complete!');
