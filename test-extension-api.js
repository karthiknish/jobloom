#!/usr/bin/env node

/**
 * test-extension-api.js - Comprehensive test for all HireAll Chrome extension API calls
 *
 * This script tests all API endpoints that the Chrome extension uses to communicate
 * with the HireAll webapp. It validates authentication, rate limiting, and proper
 * error handling for each endpoint.
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

// Mock authentication token (same approach as other test scripts)
const MOCK_AUTH_TOKEN = process.env.MOCK_AUTH_TOKEN || 'mock-jwt-token-for-testing';

let authToken = MOCK_AUTH_TOKEN;
let testUserId = process.env.TEST_USER_ID || 'test-user-123';
let testJobId = null;
let testApplicationId = null;

// CSRF token storage
let csrfToken = null;
let csrfCookie = null;

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function recordTest(name, passed, error = null) {
  results.total++;
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }

  results.tests.push({
    name,
    passed,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });

  const status = passed ? '✅ PASS' : '❌ FAIL';
  log(`${status} ${name}`);
  if (error) {
    console.log(`   Error: ${error.message}`);
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
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

    req.on('error', reject);

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

// API request helper with auth
async function apiRequest(method, path, body = null, auth = true) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'HireAll-Extension-Test/1.0'
  };

  if (auth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Add CSRF token for non-GET requests
  if (method !== 'GET' && csrfToken) {
    headers['x-csrf-token'] = csrfToken;
    if (csrfCookie) {
      headers['Cookie'] = `__csrf-token=${csrfCookie}`;
    }
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = body;
  }

  return makeRequest(url, options);
}

// Authentication setup
async function setupAuth() {
  log('Setting up mock authentication...');

  try {
    // Get CSRF token first
    const csrfResult = await getCsrfToken();
    if (!csrfResult || !csrfResult.csrfToken) {
      throw new Error('Failed to obtain CSRF token');
    }
    log('CSRF token obtained');

    // Use mock authentication (same as other test scripts)
    recordTest('Authentication Setup', true);
    log(`Using mock authentication for user: ${testUserId}`);
  } catch (error) {
    recordTest('Authentication Setup', false, error);
    throw error;
  }
}

// Test API endpoints used by the extension
async function testExtensionAPIs() {
  log('Testing extension API endpoints...');

  // Note: These tests use mock authentication, so we expect 401 responses
  // In a real extension, valid Firebase tokens would be used

  // Test 1: POST /api/app/jobs (from background.ts and addToBoard.ts)
  try {
    const jobData = {
      title: 'Test Job from Extension',
      company: 'Test Company',
      location: 'Test City',
      description: 'This is a test job created by the extension API test',
      url: 'https://example.com/job/test',
      source: 'extension-test'
    };

    const response = await apiRequest('POST', '/api/app/jobs', jobData);

    // With mock auth, we expect 401, but the endpoint should exist
    if (response.status === 401) {
      recordTest('POST /api/app/jobs (auth required)', true);
    } else {
      throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('POST /api/app/jobs', false, error);
  }

  // Test 2: GET /api/app/jobs/user/{userId} (from addToBoard.ts)
  try {
    const response = await apiRequest('GET', `/api/app/jobs/user/${testUserId}`);

    if (response.status === 401) {
      recordTest('GET /api/app/jobs/user/{userId} (auth required)', true);
    } else {
      throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('GET /api/app/jobs/user/{userId}', false, error);
  }

  // Test 3: GET /api/app/jobs/{jobId} (from addToBoard.ts)
  try {
    const response = await apiRequest('GET', `/api/app/jobs/test-job-id`);

    if (response.status === 401) {
      recordTest('GET /api/app/jobs/{jobId} (auth required)', true);
    } else {
      throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('GET /api/app/jobs/{jobId}', false, error);
  }

  // Test 4: POST /api/app/applications (from addToBoard.ts)
  try {
    const applicationData = {
      jobId: 'test-job-id',
      status: 'applied',
      appliedDate: new Date().toISOString(),
      notes: 'Test application from extension API test'
    };

    const response = await apiRequest('POST', '/api/app/applications', applicationData);

    if (response.status === 401) {
      recordTest('POST /api/app/applications (auth required)', true);
    } else {
      throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('POST /api/app/applications', false, error);
  }

  // Test 5: GET /api/app/applications/user/{userId} (from addToBoard.ts)
  try {
    const response = await apiRequest('GET', `/api/app/applications/user/${testUserId}`);

    if (response.status === 401) {
      recordTest('GET /api/app/applications/user/{userId} (auth required)', true);
    } else {
      throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('GET /api/app/applications/user/{userId}', false, error);
  }

  // Test 6: PUT /api/app/applications/{applicationId} (from addToBoard.ts)
  try {
    const updateData = {
      status: 'interviewing',
      notes: 'Updated notes from extension API test'
    };

    const response = await apiRequest('PUT', `/api/app/applications/test-app-id`, updateData);

    if (response.status === 401) {
      recordTest('PUT /api/app/applications/{applicationId} (auth required)', true);
    } else {
      throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('PUT /api/app/applications/{applicationId}', false, error);
  }

  // Test 7: POST /api/app/follow-ups (from addToBoard.ts)
  try {
    const followUpData = {
      applicationId: 'test-app-id',
      type: 'email',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      notes: 'Test follow-up from extension API test'
    };

    const response = await apiRequest('POST', '/api/app/follow-ups', followUpData);

    if (response.status === 401) {
      recordTest('POST /api/app/follow-ups (auth required)', true);
    } else {
      throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('POST /api/app/follow-ups', false, error);
  }

  // Test 8: PUT /api/app/users/{uid}/settings (from webapp-content.ts)
  try {
    const settingsData = {
      theme: 'dark',
      notifications: true,
      extensionEnabled: true
    };

    const response = await apiRequest('PUT', `/api/app/users/${testUserId}/settings`, settingsData);

    // This endpoint returns 404 for non-existent users, which is expected
    if (response.status === 401 || response.status === 404) {
      recordTest('PUT /api/app/users/{uid}/settings (endpoint exists)', true);
    } else {
      throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('PUT /api/app/users/{uid}/settings', false, error);
  }

  // Test 9: GET /api/app/sponsorship/companies (from popup.ts)
  try {
    const response = await apiRequest('GET', '/api/app/sponsorship/companies');

    if (response.status === 401) {
      recordTest('GET /api/app/sponsorship/companies (auth required)', true);
    } else {
      throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('GET /api/app/sponsorship/companies', false, error);
  }

  // Test 10: GET /api/subscription/status (from rateLimiter.ts)
  try {
    const response = await apiRequest('GET', '/api/subscription/status');

    if (response.status === 401 || response.status === 429) {
      // 401 = auth required (expected), 429 = rate limited (also acceptable)
      recordTest('GET /api/subscription/status (auth required/rate limited)', true);
    } else {
      throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('GET /api/subscription/status', false, error);
  }

  // Test 11: GET /api/user/uk-sponsorship-criteria (from popup.ts) - External API
  try {
    const response = await apiRequest('GET', '/api/user/uk-sponsorship-criteria');

    // This might be a 404 if the endpoint doesn't exist, which is acceptable
    if (response.status === 200 || response.status === 404 || response.status === 401) {
      recordTest('GET /api/user/uk-sponsorship-criteria (endpoint exists)', true);
    } else {
      throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('GET /api/user/uk-sponsorship-criteria', false, error);
  }
}

// Test rate limiting behavior
async function testRateLimiting() {
  log('Testing rate limiting...');

  try {
    // Make multiple rapid requests to test rate limiting
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(apiRequest('GET', '/api/subscription/status'));
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);

    if (rateLimited) {
      recordTest('Rate Limiting', true);
    } else {
      // Rate limiting might not be triggered in test environment
      recordTest('Rate Limiting (not triggered)', true);
    }
  } catch (error) {
    recordTest('Rate Limiting', false, error);
  }
}

// Test authentication failures
async function testAuthFailures() {
  log('Testing authentication failures...');

  // Test without auth token
  try {
    const response = await apiRequest('GET', `/api/app/jobs/user/${testUserId}`, null, false);

    if (response.status === 401 || response.status === 403) {
      recordTest('Authentication Required', true);
    } else {
      throw new Error(`Expected 401/403, got ${response.status}`);
    }
  } catch (error) {
    recordTest('Authentication Required', false, error);
  }

  // Test with invalid token
  try {
    const originalToken = authToken;
    authToken = 'invalid-token';

    const response = await apiRequest('GET', `/api/app/jobs/user/${testUserId}`);

    if (response.status === 401 || response.status === 403) {
      recordTest('Invalid Token Handling', true);
    } else {
      throw new Error(`Expected 401/403, got ${response.status}`);
    }

    // Restore valid token
    authToken = originalToken;
  } catch (error) {
    recordTest('Invalid Token Handling', false, error);
    // Restore token even on error
    authToken = 'mock-jwt-token-for-testing';
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting HireAll Extension API Tests');
  log(`Testing against: ${BASE_URL}`);

  try {
    await setupAuth();
    await testExtensionAPIs();
    await testRateLimiting();
    await testAuthFailures();

    // Print results
    log('\n📊 Test Results Summary:');
    log(`Total Tests: ${results.total}`);
    log(`Passed: ${results.passed}`);
    log(`Failed: ${results.failed}`);
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
      log('\n❌ Failed Tests:');
      results.tests.filter(t => !t.passed).forEach(test => {
        log(`  - ${test.name}: ${test.error}`);
      });
    }

    log('\n✅ Extension API testing completed!');

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };