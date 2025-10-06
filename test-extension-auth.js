/**
 * Browser console script to test extension authentication
 * Run this in the browser console on a LinkedIn jobs page
 */

// Test 1: Check extension context
console.log('=== HireAll Extension Auth Test ===');
console.log('1. Extension Context Check:');
console.log('Chrome available:', typeof chrome !== 'undefined');
console.log('Runtime ID:', chrome?.runtime?.id);
console.log('Storage available:', !!chrome?.storage);

// Test 2: Check stored authentication
console.log('\n2. Stored Authentication:');
if (chrome?.storage?.sync) {
  chrome.storage.sync.get(['firebaseUid', 'userId', 'userEmail'], (result) => {
    console.log('Firebase UID:', result.firebaseUid);
    console.log('User ID:', result.userId);
    console.log('User Email:', result.userEmail);
    console.log('Has stored auth:', !!(result.firebaseUid || result.userId));
  });
} else {
  console.log('❌ Chrome storage not available');
}

// Test 3: Check cached token
console.log('\n3. Cached Token:');
if (chrome?.storage?.local) {
  chrome.storage.local.get(['hireallAuthToken'], (result) => {
    if (result.hireallAuthToken) {
      console.log('Token exists:', !!result.hireallAuthToken.token);
      console.log('Token source:', result.hireallAuthToken.source);
      console.log('Token expires:', new Date(result.hireallAuthToken.expiresAt).toLocaleString());
      console.log('Token expired:', Date.now() > result.hireallAuthToken.expiresAt);
    } else {
      console.log('❌ No cached token found');
    }
  });
}

// Test 4: Check for Hireall tabs
console.log('\n4. Hireall Tabs:');
if (chrome?.tabs?.query) {
  chrome.tabs.query({
    url: ["https://hireall.app/*", "https://*.hireall.app/*", "https://*.vercel.app/*", "https://*.netlify.app/*"]
  }, (tabs) => {
    console.log('Hireall tabs found:', tabs.length);
    tabs.forEach((tab, index) => {
      console.log(`  Tab ${index + 1}: ${tab.url} (ID: ${tab.id})`);
    });
  });
} else {
  console.log('❌ Chrome tabs API not available');
}

// Test 5: Try to sync auth state
console.log('\n5. Auth Sync Test:');
if (typeof hireallDebugAuth === 'function') {
  console.log('✅ Diagnostic functions available');
  console.log('Run hireallDebugAuth() for full diagnostics');
  console.log('Run hireallRepairAuth() to attempt repair');
} else {
  console.log('❌ Diagnostic functions not available - reload the page');
}

console.log('\n=== Manual Fix Steps ===');
console.log('If authentication is failing:');
console.log('1. Open https://hireall.app in a new tab and sign in');
console.log('2. Return to this LinkedIn page');
console.log('3. Run: hireallRepairAuth()');
console.log('4. Refresh the LinkedIn page');
console.log('5. Test sponsor check functionality');
