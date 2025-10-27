/**
 * API Error Handling Test Suite
 * Tests all API endpoints for proper error responses and codes
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
};

// Test utilities
class ApiTester {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testEndpoint(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const testResult = {
      path,
      method: options.method || 'GET',
      status: 'pending',
      statusCode: null,
      response: null,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`\n🧪 Testing ${options.method || 'GET'} ${path}`);
      
      const response = await fetch(url, {
        timeout: TEST_CONFIG.timeout,
        ...options
      });

      testResult.statusCode = response.status;
      
      const responseText = await response.text();
      
      try {
        testResult.response = JSON.parse(responseText);
      } catch {
        testResult.response = responseText;
      }

      // Validate error response format
      if (response.status >= 400) {
        testResult.status = this.validateErrorResponse(testResult.response, testResult.statusCode);
      } else {
        testResult.status = 'success';
      }

      console.log(`✅ Status: ${response.status}`);
      if (response.status >= 400) {
        console.log(`📝 Error: ${JSON.stringify(testResult.response, null, 2)}`);
      }

    } catch (error) {
      testResult.error = error.message;
      testResult.status = 'error';
      console.log(`❌ Error: ${error.message}`);
    }

    this.results.push(testResult);
    return testResult;
  }

  validateErrorResponse(response, statusCode) {
    // Check if response has proper error structure
    if (!response || typeof response !== 'object') {
      return 'invalid_response_format';
    }

    // Check for error field
    if (!response.error && !response.message) {
      return 'missing_error_field';
    }

    // Check for error code if using new format
    if (response.error && typeof response.error === 'object') {
      if (!response.error.code) {
        return 'missing_error_code';
      }
      
      if (!response.error.message) {
        return 'missing_error_message';
      }

      // Check timestamp
      if (!response.error.timestamp) {
        return 'missing_timestamp';
      }

      // Check request ID
      if (!response.error.requestId) {
        return 'missing_request_id';
      }
    }

    // Validate status code mapping
    const expectedErrorTypes = {
      400: ['validation', 'bad_request'],
      401: ['auth', 'unauthorized'],
      403: ['forbidden', 'permission'],
      404: ['not_found'],
      409: ['conflict'],
      422: ['unprocessable'],
      429: ['rate_limit'],
      500: ['internal', 'server_error'],
      502: ['external_service'],
      503: ['service_unavailable']
    };

    const expectedTypes = expectedErrorTypes[statusCode];
    if (expectedTypes && response.error) {
      const errorType = this.getErrorType(response.error.code);
      if (!expectedTypes.includes(errorType)) {
        return 'mismatched_error_type';
      }
    }

    return 'valid';
  }

  getErrorType(errorCode) {
    if (!errorCode) return 'unknown';
    
    if (errorCode.includes('AUTH_')) return 'auth';
    if (errorCode.includes('VALID_')) return 'validation';
    if (errorCode.includes('USER_')) return 'user';
    if (errorCode.includes('SUB_')) return 'subscription';
    if (errorCode.includes('JOB_')) return 'job';
    if (errorCode.includes('CV_')) return 'cv';
    if (errorCode.includes('AI_')) return 'ai';
    if (errorCode.includes('EXT_')) return 'external_service';
    if (errorCode.includes('DB_')) return 'database';
    if (errorCode.includes('SYS_')) return 'server_error';
    if (errorCode.includes('NET_')) return 'network';
    if (errorCode.includes('SEC_')) return 'security';
    
    return 'unknown';
  }

  generateReport() {
    const total = this.results.length;
    const valid = this.results.filter(r => r.status === 'valid' || r.status === 'success').length;
    const invalid = this.results.filter(r => r.status !== 'valid' && r.status !== 'success' && r.status !== 'pending').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log('\n📊 API Error Handling Test Report');
    console.log('=====================================');
    console.log(`Total Tests: ${total}`);
    console.log(`Valid: ${valid}`);
    console.log(`Invalid: ${invalid}`);
    console.log(`Network Errors: ${errors}`);
    console.log(`Success Rate: ${((valid / total) * 100).toFixed(1)}%`);

    if (invalid > 0) {
      console.log('\n❌ Invalid Responses:');
      this.results
        .filter(r => r.status !== 'valid' && r.status !== 'success' && r.status !== 'error')
        .forEach(r => {
          console.log(`  ${r.method} ${r.path} - ${r.status}: ${r.statusCode}`);
        });
    }

    return {
      total,
      valid,
      invalid,
      errors,
      successRate: (valid / total) * 100,
      results: this.results
    };
  }
}

// Test cases
async function runErrorHandlingTests() {
  const tester = new ApiTester();

  console.log('🚀 Starting API Error Handling Tests\n');

  // Test authentication endpoints
  await tester.testEndpoint('/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  await tester.testEndpoint('/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'invalid_token' })
  });

  await tester.testEndpoint('/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: null })
  });

  // Test CV upload endpoints
  await tester.testEndpoint('/cv/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  await tester.testEndpoint('/cv/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer valid_but_expired' },
    body: new FormData()
  });

  // Test job endpoints
  await tester.testEndpoint('/app/jobs', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  await tester.testEndpoint('/app/jobs/invalid-job-id', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  // Test subscription endpoints
  await tester.testEndpoint('/subscription/status', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  await tester.testEndpoint('/subscription/portal', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer invalid_token', 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Test user endpoints
  await tester.testEndpoint('/user/uk-sponsorship-criteria', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  // Test admin endpoints
  await tester.testEndpoint('/admin/check', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  // Test AI endpoints
  await tester.testEndpoint('/ai/cover-letter', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer invalid_token', 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  await tester.testEndpoint('/ai/resume', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer invalid_token', 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Test webhook endpoints (should fail signature validation)
  await tester.testEndpoint('/stripe/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Test rate limiting
  console.log('\n⏱️  Testing rate limiting (multiple rapid requests)...');
  for (let i = 0; i < 5; i++) {
    await tester.testEndpoint('/health', {
      method: 'GET'
    });
  }

  // Test invalid endpoints
  await tester.testEndpoint('/invalid-endpoint');
  await tester.testEndpoint('/app/invalid-route');

  // Test HTTP methods not allowed
  await tester.testEndpoint('/auth/session', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Generate report
  const report = tester.generateReport();
  
  // Save report to file
  const fs = require('fs');
  fs.writeFileSync(
    `api-error-handling-test-report-${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log(`\n📄 Detailed report saved to: api-error-handling-test-report-${new Date().toISOString().split('T')[0]}.json`);

  return report;
}

// Specific error code tests
async function testSpecificErrorCodes() {
  console.log('\n🔍 Testing Specific Error Codes\n');

  const tester = new ApiTester();

  // Test validation errors
  console.log('Testing validation errors...');
  await tester.testEndpoint('/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: '' })
  });

  // Test file upload errors
  console.log('Testing file upload errors...');
  await tester.testEndpoint('/cv/upload', {
    method: 'POST',
    headers: { 
      'Authorization': 'Bearer invalid_token',
      'Content-Type': 'multipart/form-data'
    },
    body: JSON.stringify({ file: 'invalid' })
  });

  // Test database errors
  console.log('Testing database errors...');
  await tester.testEndpoint('/app/jobs/non-existent-job-id', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token' }
  });

  return tester.generateReport();
}

// Main execution
async function main() {
  try {
    console.log('🎯 API Error Handling Test Suite');
    console.log('=================================\n');

    const generalReport = await runErrorHandlingTests();
    const specificReport = await testSpecificErrorCodes();

    console.log('\n🏁 Test Summary');
    console.log('===============');
    console.log(`General Tests: ${generalReport.valid}/${generalReport.total} passed`);
    console.log(`Specific Tests: ${specificReport.valid}/${specificReport.total} passed`);
    
    const overallTotal = generalReport.total + specificReport.total;
    const overallValid = generalReport.valid + specificReport.valid;
    console.log(`Overall: ${overallValid}/${overallTotal} passed (${((overallValid/overallTotal)*100).toFixed(1)}%)`);

    if (overallValid === overallTotal) {
      console.log('\n🎉 All tests passed! API error handling is working correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review the report and fix the issues.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { ApiTester, runErrorHandlingTests, testSpecificErrorCodes };
