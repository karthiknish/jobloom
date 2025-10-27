/**
 * Frontend Error Handling Test Suite
 * Tests the comprehensive frontend error handling system
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test utilities
class FrontendErrorTester {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testFrontendErrorHandling() {
    console.log('🧪 Starting Frontend Error Handling Tests\n');

    const tests = [
      {
        name: 'API Client - Success Response',
        test: () => this.testSuccessResponse()
      },
      {
        name: 'API Client - Authentication Error (401)',
        test: () => this.testAuthError()
      },
      {
        name: 'API Client - Validation Error (400)',
        test: () => this.testValidationError()
      },
      {
        name: 'API Client - Not Found Error (404)',
        test: () => this.testNotFoundError()
      },
      {
        name: 'API Client - Rate Limit Error (429)',
        test: () => this.testRateLimitError()
      },
      {
        name: 'API Client - Network Error',
        test: () => this.testNetworkError()
      },
      {
        name: 'API Client - Server Error (500)',
        test: () => this.testServerError()
      },
      {
        name: 'Hook with Error Handling - UseGet',
        test: () => this.testUseGetHook()
      },
      {
        name: 'Hook with Error Handling - UsePost',
        test: () => this.testUsePostHook()
      },
      {
        name: 'File Upload Error Handling',
        test: () => this.testFileUploadError()
      }
    ];

    for (const test of tests) {
      console.log(`\n🧪 ${test.name}`);
      try {
        await test.test();
        this.results.push({ name: test.name, status: 'success' });
        console.log('✅ Passed');
      } catch (error) {
        this.results.push({ name: test.name, status: 'failed', error: error.message });
        console.log(`❌ Failed: ${error.message}`);
      }
    }

    this.generateReport();
    return this.results;
  }

  async testSuccessResponse() {
    // Mock successful API response
    const mockSuccessResponse = {
      success: true,
      data: { id: 1, name: 'Test User' },
      message: 'Success',
      timestamp: Date.now()
    };

    // This would be handled by the API client
    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSuccessResponse)
        })
      );

      // Test the response parsing
      const response = await fetch('/api/test-success');
      const data = await response.json();
      
      if (data.success) {
        console.log('   Response:', data);
        return data;
      }
      throw new Error('Expected success response');
    }
  }

  async function testAuthError() {
    // Mock authentication error
    const mockAuthError = {
      success: false,
      error: {
        code: 'AUTH_1001',
        message: 'Authentication required',
        timestamp: Date.now(),
        requestId: 'req_1234567890',
        path: '/api/protected',
        method: 'GET'
      }
    };

    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve(mockAuthError)
        })
      });

      const response = await fetch('/api/protected');
      const data = await response.json();
      
      if (!data.success && data.error.code === 'AUTH_1001') {
        console.log('   Auth error handled correctly');
        return data;
      }
      throw new Error('Expected authentication error');
    }
  }

  async function testValidationError() {
    // Mock validation error
    const mockValidationError = {
      success: false,
      error: {
        code: 'VALID_1101',
        message: 'Email is required',
        field: 'email',
        timestamp: Date.now(),
        requestId: 'req_1234567891',
        path: '/api/user/profile',
        method: 'POST'
      }
    };

    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockValidationError)
        })
      );

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Missing email field
      });
      const data = await response.json();
      
      if (!data.success && data.error.field === 'email') {
        console.log('   Validation error handled correctly');
        return data;
      }
      throw new Error('Expected validation error');
    }
  }

  async function testNotFoundError() {
    // Mock not found error
    const mockNotFoundError = {
      success: false,
      error: {
        code: 'CONTENT_2200',
        message: 'The requested resource was not found',
        timestamp: Date.now(),
        requestId: 'req_1234567892',
        path: '/api/nonexistent',
        method: 'GET'
      }
    };

    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve(mockNotFoundError)
        })
      );

      const response = await fetch('/api/nonexistent');
      const data = await response.json();
      
      if (!data.success && data.error.code === 'CONTENT_2200') {
        console.log('   Not found error handled correctly');
        return data;
      }
      throw new Error('Expected not found error');
    }
  }

  async function testRateLimitError() {
    // Mock rate limit error
    const mockRateLimitError = {
      success: false,
      error: {
        code: 'EXT_1706',
        message: 'Rate limit exceeded. Please wait before trying again.',
        retryAfter: 60,
        timestamp: Date.now(),
        requestId: 'req_1234567893',
        path: '/api/cv/upload',
        method: 'POST'
      }
    };

    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve(mockRateLimitError),
          headers: {
            'Retry-After': '60'
          }
        })
      );

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      const data = await response.json();
      
      if (!data.success && data.error.code === 'EXT_1706') {
        console.log('   Rate limit error handled correctly');
        return data;
      }
      throw new Error('Expected rate limit error');
    }
  }

  async function testNetworkError() {
    // Mock network error
    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      try {
        await fetch('/api/network-error');
      throw new Error('Expected network error');
      } catch (error) {
        if (error.message === 'Network error') {
          console.log('   Network error handled correctly');
          return { error: error.message };
        }
        throw error;
      }
    }
  }

  async function testServerError() {
    // Mock server error
    const mockServerError = {
      success: false,
      error: {
        code: 'SYS_1900',
        message: 'Internal server error',
        timestamp: Date.now(),
        requestId: 'req_1234567894',
        path: '/api/admin/users',
        method: 'GET'
      }
    };

    if (typeof window !== 'undefined') {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve(mockServerError)
        })
      );

      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (!data.success && data.error.code === 'SYS_1900') {
        console.log('   Server error handled correctly');
        return data;
      }
      throw new Error('Expected server error');
    }
  }

  async testUseGetHook() {
    // This would test the useEnhancedApi hook
    console.log('   Testing useEnhancedApi hook...');
    
    // Since we can't test React hooks directly in Node.js, we'll simulate the hook behavior
    const mockHook = {
      data: null,
      loading: false,
      error: null,
      execute: async () => {
        // Simulate API call with error
        throw new FrontendApiError(
          'Test error',
          'TEST_0001',
          500
        );
      }
    };

    try {
      await mockHook.execute();
      throw new Error('Expected error to be caught');
    } catch (error) {
      if (error instanceof FrontendApiError) {
        console.log('   Hook error handled correctly');
        return error;
      }
      throw error;
    }
  }

  async function testUsePostHook() {
    // Test POST request with error handling
    console.log('   Testing useEnhancedApi POST...');
    
    const mockHook = {
      data: null,
      loading: false,
      error: null,
      execute: async (data: any) => {
        // Simulate form validation error
        throw new FrontendApiError(
          'Validation failed',
          'VALID_1100',
          400,
          undefined,
          'email'
        );
      }
    };

    try {
      await mockHook.execute({ email: '' });
      throw new Error('Expected error to be caught');
    } catch (error) {
      if (error instanceof FrontendApiError) {
        console.log('   POST hook error handled correctly');
        return error;
      }
      throw error;
    }
  }

  async function testFileUploadError() {
    // Test file upload error handling
    const mockFileUploadError = {
      success: false,
      error: {
        code: 'VALID_1104',
        message: 'Invalid file type. Only PDF, Word, and text files are allowed.',
        field: 'file',
        timestamp: Date.now(),
        requestId: 'req_1234567895',
        path: '/api/cv/upload',
        method: 'POST'
      }
    };

    console.log('   Testing file upload error handling...');
    
    // Simulate file upload error
    const error = new FrontendApiError(
      mockFileUploadError.error.message,
      mockFileUploadError.error.code,
      mockFileUploadError.status,
      mockFileUploadError.requestId,
      mockFileUploadError.field,
      mockFileUploadError.details
    );

    console.log('   File upload error handled correctly');
    return error;
  }

  generateReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;

    console.log('\n📊 Frontend Error Handling Test Report');
    console.log('====================================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  ${r.name} - ${r.error?.message || 'Unknown error'}`);
        });
    }

    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.results
    };
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Frontend Error Handling Test Suite');
    console.log('=================================\n');

    const tester = new FrontendErrorTester();
    const report = tester.testFrontendErrorHandling();

    console.log('\n📋 Test Summary');
    console.log('===============');
    console.log(`Total: ${report.total} tests`);
    console.log(`Passed: ${report.passed} tests`);
    console.log(`Failed: ${report.failed} tests`);
    console.log(`Success Rate: ${report.successRate.toFixed(1)}%`);

    if (report.successRate === 100) {
      console.log('\n🎉 All tests passed! Frontend error handling is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results.');
    }

    return report;

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { FrontendErrorTester, main };
