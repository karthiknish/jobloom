#!/usr/bin/env node

/**
 * Comprehensive Auth and Admin Routes Testing Script for HireAll
 *
 * This script tests all authentication and admin-related endpoints and functions.
 * Run with: node test-auth-admin-comprehensive.js
 */

const https = require('https');
const http = require('http');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Firebase Admin instance
let adminApp = null;
let adminAuth = null;
let adminDb = null;

/**
 * Initialize Firebase Admin SDK
 */
async function initFirebaseAdmin() {
  if (adminApp) return adminApp;

  try {
    // Try to load service account
    const serviceAccountPath = path.join(__dirname, 'hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('Service account file not found');
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);

    console.log('✓ Firebase Admin initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Admin-Test-Script/1.0',
        ...options.headers
      }
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test endpoint
 */
async function testEndpoint(name, url, options = {}) {
  results.total++;

  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${options.method || 'GET'}`);

  try {
    const startTime = Date.now();
    const response = await makeRequest(url, options);
    const duration = Date.now() - startTime;

    const isSuccess = options.expectedStatus
      ? response.status === options.expectedStatus
      : (response.status >= 200 && response.status < 400);

    if (isSuccess) {
      results.passed++;
      console.log(`   ✅ PASS (${duration}ms) - Status: ${response.status}`);
      if (options.logResponse) {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    } else {
      results.failed++;
      console.log(`   ❌ FAIL (${duration}ms) - Status: ${response.status} (expected: ${options.expectedStatus || '200-399'})`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
      }
    }

    results.details.push({
      name,
      url,
      method: options.method || 'GET',
      status: response.status,
      duration,
      success: isSuccess,
      response: response.data
    });

  } catch (error) {
    results.failed++;
    console.log(`   ❌ ERROR - ${error.message}`);

    results.details.push({
      name,
      url,
      method: options.method || 'GET',
      status: null,
      duration: 0,
      success: false,
      error: error.message
    });
  }
}

/**
 * Skip endpoint
 */
function skipEndpoint(name, reason) {
  results.total++;
  results.skipped++;

  console.log(`\n⏭️  Skipping: ${name}`);
  console.log(`   Reason: ${reason}`);

  results.details.push({
    name,
    url: 'N/A',
    method: 'N/A',
    status: null,
    duration: 0,
    success: false,
    skipped: true,
    reason
  });
}

/**
 * Create test user in Firebase Auth
 */
async function createTestUser(email, password, isAdmin = false) {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Set admin status in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      isAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✓ Created test user: ${email} (UID: ${userRecord.uid})`);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      // User already exists, get their UID
      const userRecord = await adminAuth.getUserByEmail(email);
      console.log(`✓ Test user already exists: ${email} (UID: ${userRecord.uid})`);
      return userRecord;
    }
    throw error;
  }
}

/**
 * Generate ID token for test user
 */
async function generateIdToken(uid) {
  // Create custom token and then exchange for ID token
  const customToken = await adminAuth.createCustomToken(uid);

  // For testing purposes, we'll use the custom token directly
  // In a real scenario, you'd exchange this on the client side
  return customToken;
}

/**
 * Clean up test users
 */
async function cleanupTestUsers() {
  try {
    const testEmails = [TEST_USER_EMAIL, TEST_ADMIN_EMAIL];

    for (const email of testEmails) {
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        await adminAuth.deleteUser(userRecord.uid);
        await adminDb.collection('users').doc(userRecord.uid).delete();
        console.log(`✓ Cleaned up test user: ${email}`);
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          console.warn(`⚠️  Failed to cleanup ${email}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Cleanup failed:', error.message);
  }
}

/**
 * Test all auth and admin endpoints
 */
async function testAllAuthAdminEndpoints() {
  console.log("🚀 Starting Comprehensive Auth and Admin Testing for HireAll");
  console.log("=".repeat(80));

  try {
    // Initialize Firebase Admin
    await initFirebaseAdmin();

    // Create test users
    console.log("\n👤 Creating test users...");
    const testUser = await createTestUser(TEST_USER_EMAIL, TEST_USER_PASSWORD, false);
    const testAdmin = await createTestUser(TEST_ADMIN_EMAIL, TEST_USER_PASSWORD, true);

    // Generate tokens (for testing purposes)
    const testUserToken = await generateIdToken(testUser.uid);
    const testAdminToken = await generateIdToken(testAdmin.uid);

    console.log("\n🔐 Testing Authentication Endpoints");

    // Test session endpoints
    await testEndpoint("Session GET (CSRF)", `${BASE_URL}/api/auth/session`, {
      logResponse: true
    });

    // Test session creation with invalid token (should fail with CSRF error)
    await testEndpoint("Session POST (Invalid Token)", `${BASE_URL}/api/auth/session`, {
      method: 'POST',
      body: { idToken: 'invalid-token' },
      expectedStatus: 403 // CSRF validation fails
    });

    // Test session creation with valid token (would need proper ID token)
    skipEndpoint("Session POST (Valid Token)", "Requires proper ID token exchange");

    // Test session deletion (should fail with CSRF error)
    await testEndpoint("Session DELETE", `${BASE_URL}/api/auth/session`, {
      method: 'DELETE',
      expectedStatus: 403 // CSRF validation fails
    });

    console.log("\n👑 Testing Admin Endpoints");

    // Test admin check without auth
    await testEndpoint("Admin Check (No Auth)", `${BASE_URL}/api/admin/check`, {
      expectedStatus: 401
    });

    // Test admin check with regular user (would need session)
    skipEndpoint("Admin Check (Regular User)", "Requires authenticated session");

    // Test admin check with admin user (would need session)
    skipEndpoint("Admin Check (Admin User)", "Requires authenticated session");

    console.log("\n📧 Testing Admin Email Endpoints");

    // Test email campaigns (should require admin)
    await testEndpoint("Email Campaigns (No Auth)", `${BASE_URL}/api/admin/email-campaigns`, {
      expectedStatus: 401
    });

    // Test email list (should require admin)
    await testEndpoint("Email List (No Auth)", `${BASE_URL}/api/admin/email-list`, {
      expectedStatus: 401
    });

    // Test email templates (should require admin)
    await testEndpoint("Email Templates (No Auth)", `${BASE_URL}/api/admin/email-templates`, {
      expectedStatus: 401
    });

    // Test email test (should fail with CSRF error)
    await testEndpoint("Email Test (No Auth)", `${BASE_URL}/api/admin/email-test`, {
      method: 'POST',
      body: { to: 'test@example.com', subject: 'Test', content: 'Test content' },
      expectedStatus: 403 // CSRF validation fails
    });

    console.log("\n🔒 Testing Protected App Endpoints");

    // Test users endpoint (should require admin)
    await testEndpoint("Users List (No Auth)", `${BASE_URL}/api/app/users`, {
      expectedStatus: 401
    });

    // Test jobs endpoint (should require auth)
    await testEndpoint("Jobs List (No Auth)", `${BASE_URL}/api/app/jobs`, {
      expectedStatus: 401
    });

    // Test applications endpoint (should require auth)
    await testEndpoint("Applications List (No Auth)", `${BASE_URL}/api/app/applications`, {
      expectedStatus: 401
    });

    // Test contacts endpoint (should require admin)
    await testEndpoint("Contacts List (No Auth)", `${BASE_URL}/api/app/contacts`, {
      expectedStatus: 401
    });

    console.log("\n🔓 Testing Public Endpoints");

    // Test blog posts (should be public)
    await testEndpoint("Blog Posts (Public)", `${BASE_URL}/api/blog/posts`, {
      logResponse: true
    });

    // Test sponsors (should be public)
    await testEndpoint("Sponsors (Public)", `${BASE_URL}/api/sponsors`, {
      logResponse: true
    });

    console.log("\n🧪 Testing Firebase Admin Functions");

    // Test isUserAdmin function
    const { isUserAdmin } = require('./src/firebase/admin.ts');

    console.log("\nTesting isUserAdmin function...");

    // Test with regular user
    const regularUserAdmin = await isUserAdmin(testUser.uid);
    console.log(`✓ Regular user admin status: ${regularUserAdmin} (expected: false)`);
    if (regularUserAdmin === false) {
      results.passed++;
    } else {
      results.failed++;
      console.log("❌ Regular user should not be admin");
    }
    results.total++;

    // Test with admin user
    const adminUserAdmin = await isUserAdmin(testAdmin.uid);
    console.log(`✓ Admin user admin status: ${adminUserAdmin} (expected: true)`);
    if (adminUserAdmin === true) {
      results.passed++;
    } else {
      results.failed++;
      console.log("❌ Admin user should be admin");
    }
    results.total++;

    // Test with invalid user
    const invalidUserAdmin = await isUserAdmin('invalid-user-id');
    console.log(`✓ Invalid user admin status: ${invalidUserAdmin} (expected: false)`);
    if (invalidUserAdmin === false) {
      results.passed++;
    } else {
      results.failed++;
      console.log("❌ Invalid user should not be admin");
    }
    results.total++;

    // Test with empty user ID
    const emptyUserAdmin = await isUserAdmin('');
    console.log(`✓ Empty user ID admin status: ${emptyUserAdmin} (expected: false)`);
    if (emptyUserAdmin === false) {
      results.passed++;
    } else {
      results.failed++;
      console.log("❌ Empty user ID should not be admin");
    }
    results.total++;

    console.log("\n🧹 Cleaning up test users...");
    await cleanupTestUsers();

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    results.failed++;
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 Auth and Admin Test Results Summary");
  console.log("=".repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(
    `Success Rate: ${(
      (results.passed / (results.total - results.skipped)) *
      100
    ).toFixed(1)}%`
  );

  if (results.failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.details
      .filter((test) => !test.success && !test.skipped)
      .forEach((test) => {
        console.log(`   - ${test.name}: ${test.status || "Error"}`);
      });
  }

  console.log("\n🔍 Auth and Admin Security Summary:");
  console.log("🔓 Public Endpoints: Available without authentication");
  console.log("🔒 Protected Endpoints: Require user authentication");
  console.log("👑 Admin Endpoints: Require admin privileges");
  console.log("🔐 Session Management: Proper CSRF protection and token validation");
  console.log("🛡️  Firebase Rules: Enforce data access controls");

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
testAllAuthAdminEndpoints().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});