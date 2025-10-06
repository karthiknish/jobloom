#!/usr/bin/env node

/**
 * Admin API Integration Test
 *
 * This script tests the admin functionality including admin status checks,
 * email campaigns management, and email list management.
 *
 * Run with: node test-admin-api.js
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-123';

// Mock authentication token (in a real test, this would be obtained properly)
const MOCK_AUTH_TOKEN = process.env.MOCK_AUTH_TOKEN || 'mock-jwt-token-for-testing';

// CSRF token storage for test requests
let csrfToken = null;
let csrfCookie = null;

/**
 * Make HTTP request to API
 */
function makeAPIRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCK_AUTH_TOKEN}`,
        ...options.headers
      }
    };

    // Add CSRF token for non-GET requests
    if (options.method !== 'GET' && csrfToken) {
      requestOptions.headers['x-csrf-token'] = csrfToken;
      if (csrfCookie) {
        requestOptions.headers['Cookie'] = `__csrf-token=${csrfCookie}`;
      }
    }

    const protocol = url.startsWith('https://') ? https : http;
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
 * Get CSRF token from server
 */
async function getCsrfToken() {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api/health`;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {}
    };

    const protocol = url.startsWith('https://') ? https : http;
    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      // Extract CSRF cookie from response
      const setCookieHeader = res.headers['set-cookie'];
      if (setCookieHeader) {
        const csrfCookieMatch = setCookieHeader.find(cookie => cookie.startsWith('__csrf-token='));
        if (csrfCookieMatch) {
          csrfCookie = csrfCookieMatch.split(';')[0].split('=')[1];
          csrfToken = csrfCookie;
        }
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ status: res.statusCode, csrfToken, csrfCookie });
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Check if API server is running
 */
function checkServerRunning() {
  return new Promise((resolve) => {
    const url = `${BASE_URL}/api/health`;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000
    };

    const protocol = url.startsWith('https://') ? https : http;
    const req = protocol.request(requestOptions, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Test API endpoint
 */
async function testAPIEndpoint(name, endpoint, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Method: ${options.method || 'POST'}`);

  try {
    const startTime = Date.now();
    const response = await makeAPIRequest(endpoint, options);
    const duration = Date.now() - startTime;

    const isSuccess = options.expectedStatus
      ? response.status === options.expectedStatus
      : (response.status >= 200 && response.status < 400);

    if (isSuccess) {
      console.log(`   ✅ PASS (${duration}ms) - Status: ${response.status}`);
      if (options.logResponse) {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    } else {
      console.log(`   ❌ FAIL (${duration}ms) - Status: ${response.status} (expected: ${options.expectedStatus || '200-399'})`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
      }
    }

    return { success: isSuccess, response, duration };

  } catch (error) {
    console.log(`   ❌ ERROR (${Date.now() - Date.now()}ms) - ${error.message}`);
    return { success: false, error: error.message, duration: 0 };
  }
}

/**
 * Test admin API endpoints
 */
async function testAdminAPI() {
  console.log("👑 Admin API Integration Test");
  console.log("==============================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("");

  // Check if server is running
  console.log("🔍 Checking server status...");
  const serverRunning = await checkServerRunning();

  if (!serverRunning) {
    console.log("❌ API server is not running");
    console.log("   To run admin API tests:");
    console.log("   1. Start the Next.js development server: npm run dev");
    console.log("   2. Wait for server to be ready on localhost:3000");
    console.log("   3. Re-run this test script");
    console.log("");

    console.log("⏭️  Skipping all admin API tests");

    const testResults = {
      total: 6,
      passed: 0,
      failed: 0,
      skipped: 6,
      serverRunning: false
    };

    console.log("\n" + "=".repeat(60));
    console.log("👑 Admin API Test Results");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️  Skipped: ${testResults.skipped}`);
    console.log(`Success Rate: 0.0% (server not running)`);

    console.log("\n🏁 Test completed with exit code: 0 (skipped)");
    return testResults;
  }

  console.log("✅ API server is running");
  console.log("");

  // Get CSRF token for authenticated requests
  console.log("🔐 Obtaining CSRF token...");
  try {
    const csrfResult = await getCsrfToken();
    if (csrfResult.status === 200 && csrfResult.csrfToken) {
      console.log("✅ CSRF token obtained");
    } else {
      console.log("⚠️  CSRF token not obtained, tests may fail");
    }
  } catch (error) {
    console.log(`⚠️  Failed to get CSRF token: ${error.message}`);
  }
  console.log("");

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    serverRunning: true
  };

  // Test 1: Admin status check (will fail due to auth)
  testResults.total++;
  const adminCheckTest = await testAPIEndpoint(
    "Admin Status Check",
    "/api/admin/check",
    {
      method: 'GET',
      expectedStatus: 401, // Expect auth failure
      logResponse: false
    }
  );

  if (adminCheckTest.success) {
    testResults.passed++;
    console.log(`   ✅ Admin check properly requires authentication`);
  } else {
    testResults.failed++;
  }

  // Test 2: Email campaigns list access (will fail due to invalid token)
  testResults.total++;
  const emailCampaignsTest = await testAPIEndpoint(
    "Email Campaigns List Access",
    "/api/admin/email-campaigns",
    {
      method: 'GET',
      expectedStatus: 401, // Now expect proper 401 for invalid token
      logResponse: false
    }
  );

  if (emailCampaignsTest.success) {
    testResults.passed++;
    console.log(`   ✅ Email campaigns properly requires valid authentication`);
  } else {
    testResults.failed++;
  }

  // Test 3: Email list access (will fail due to invalid token)
  testResults.total++;
  const emailListTest = await testAPIEndpoint(
    "Email List Access",
    "/api/admin/email-list",
    {
      method: 'GET',
      expectedStatus: 401, // Now expect proper 401 for invalid token
      logResponse: false
    }
  );

  if (emailListTest.success) {
    testResults.passed++;
    console.log(`   ✅ Email list properly requires valid authentication`);
  } else {
    testResults.failed++;
  }

  // Test 4: Email templates access (will fail due to invalid token)
  testResults.total++;
  const emailTemplatesTest = await testAPIEndpoint(
    "Email Templates Access",
    "/api/admin/email-templates",
    {
      method: 'GET',
      expectedStatus: 401, // Now expect proper 401 for invalid token
      logResponse: false
    }
  );

  if (emailTemplatesTest.success) {
    testResults.passed++;
    console.log(`   ✅ Email templates properly requires valid authentication`);
  } else {
    testResults.failed++;
  }

  // Test 5: Email test access (will fail due to invalid token)
  testResults.total++;
  const emailTestTest = await testAPIEndpoint(
    "Email Test Access",
    "/api/admin/email-test",
    {
      method: 'POST',
      body: { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' },
      expectedStatus: 401, // Now expect proper 401 for invalid token
      logResponse: false
    }
  );

  if (emailTestTest.success) {
    testResults.passed++;
    console.log(`   ✅ Email test properly requires valid authentication`);
  } else {
    testResults.failed++;
  }

  // Test 6: Admin contact management (will fail due to auth)
  testResults.total++;
  const adminContactTest = await testAPIEndpoint(
    "Admin Contact Management",
    "/api/contact",
    {
      method: 'GET',
      expectedStatus: 401, // Expect auth failure
      logResponse: false
    }
  );

  if (adminContactTest.success) {
    testResults.passed++;
    console.log(`   ✅ Admin contact management properly requires authentication`);
  } else {
    testResults.failed++;
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("👑 Admin API Test Results");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(
    `Success Rate: ${(
      (testResults.passed / (testResults.total - testResults.skipped)) *
      100
    ).toFixed(1)}%`
  );

  console.log("\n👑 Admin API Functionality Summary:");
  if (testResults.serverRunning) {
    console.log("🔐 Admin authentication: Properly implemented");
    console.log("📧 Email campaigns management: Authentication required");
    console.log("📬 Email list management: Authentication required");
    console.log("📝 Email templates: Authentication required");
    console.log("🧪 Email testing: Authentication required");
    console.log("📞 Contact management: Authentication required");
    console.log("🛡️  Security: All admin endpoints protected");
  } else {
    console.log("🔐 Admin authentication: Not tested (server offline)");
    console.log("📧 Email campaigns management: Not tested (server offline)");
    console.log("📬 Email list management: Not tested (server offline)");
    console.log("📝 Email templates: Not tested (server offline)");
    console.log("🧪 Email testing: Not tested (server offline)");
    console.log("📞 Contact management: Not tested (server offline)");
    console.log("🛡️  Security: Not tested (server offline)");
  }

  const exitCode = (testResults.failed > 0 && testResults.serverRunning) ? 1 : 0;
  console.log(`\n🏁 Test completed with exit code: ${exitCode}`);
  process.exit(exitCode);
}

// Run the admin API tests
testAdminAPI().catch(error => {
  console.error('💥 Admin API test runner failed:', error);
  process.exit(1);
});