/**
 * Example component demonstrating comprehensive API error handling
 * Shows various error scenarios and how to handle them
 */

import React, { useState } from 'react';
import { apiClient, FrontendApiError } from '@/lib/api/client';
import { useEnhancedApi } from '@/hooks/useEnhancedApi';
import { ErrorDisplay, ValidationError, FileUploadError } from '@/components/ui/error-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Upload, Info, CheckCircle, X } from 'lucide-react';

export function ApiErrorHandlingExample() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    error?: FrontendApiError;
    data?: any;
  }>>([]);

  // Example 1: Basic API call with error handling
  const {
    data: userData,
    loading: loadingUser,
    error: userError,
    execute: fetchUser,
    refetch: refetchUser
  } = useEnhancedApi(
    async () => apiClient.get('/api/user/profile'),
    {
      showLocalError: true,
      showGlobalError: false,
      onError: (error) => {
        console.log('User fetch error:', error);
      },
      onSuccess: (data) => {
        console.log('User data fetched:', data);
      }
    }
  );

  // Example 2: Form submission with validation error handling
  const {
    data: submitResult,
    loading: submitting,
    error: submitError,
    execute: submitForm
  } = useEnhancedApi(
    async (formData: any) => apiClient.post('/api/contact', formData),
    {
      immediate: false,
      showLocalError: true,
      onError: (error) => {
        if (error.field) {
          // Field-specific error - show inline
          console.log(`Validation error in field: ${error.field}`);
        }
      }
    }
  );

  // Example 3: File upload with comprehensive error handling
  const {
    data: uploadResult,
    loading: uploading,
    error: uploadError,
    execute: uploadFile
  } = useEnhancedApi(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'test-user');
      
      return apiClient.upload('/api/cv/upload', file, { userId: 'test-user' });
    },
    {
      immediate: false,
      showLocalError: true,
      onError: (error) => {
        // File upload errors need special handling
        console.log('File upload error:', error);
      }
    }
  );

  // Example 4: API call with retry logic
  const {
    data: retryData,
    loading: loadingRetry,
    error: retryError,
    execute: executeWithRetry
  } = useEnhancedApi(
    async () => {
      // Simulate a failing API call
      throw new FrontendApiError(
        'Simulated network error',
        'NET_2000',
        0
      );
    },
    {
      immediate: false,
      retryOnFailure: true,
      retries: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.log('Retry attempt failed:', error);
      }
    }
  );

  // Test functions
  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setTestResults(prev => [
      ...prev,
      { test: testName, status: 'pending' }
    ]);

    try {
      await testFn();
      setTestResults(prev => 
        prev.map(r => r.test === testName ? { ...r, status: 'success' } : r)
      );
    } catch (error) {
      setTestResults(prev => 
        prev.map(r => r.test === testName 
          ? { ...r, status: 'error', error: error as FrontendApiError } 
          : r
        )
      );
    }
  };

  const tests = [
    {
      name: 'Auth Error (401)',
      fn: () => apiClient.get('/api/admin/users')
    },
    {
      name: 'Validation Error (400)',
      fn: () => apiClient.post('/api/auth/session', {})
    },
    {
      name: 'Not Found (404)',
      fn: () => apiClient.get('/api/nonexistent-endpoint')
    },
    {
      name: 'Rate Limit (429)',
      fn: () => {
        // Make multiple rapid requests to trigger rate limiting
        return Promise.all(
          Array(10).fill(null).map(() => apiClient.get('/api/health'))
        );
      }
    },
    {
      name: 'Network Error',
      fn: () => apiClient.get('/api/invalid-domain')
    }
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    await submitForm(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await uploadFile(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          API Error Handling Examples
        </h1>
        <p className="text-gray-600">
          Comprehensive examples of error handling patterns with the new API system
        </p>
      </div>

      {/* Example 1: Basic API Call */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Basic API Call with Error Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Demonstrates basic API calls with automatic error handling, retry logic, and loading states.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchUser()} 
              disabled={loadingUser}
              className="flex items-center gap-2"
            >
              {loadingUser && <RefreshCw className="w-4 h-4 animate-spin" />}
              Fetch User Data
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => refetchUser()}
              disabled={loadingUser}
            >
              Refetch
            </Button>
          </div>

          {userData && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                User data loaded successfully!
                <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {userError && (
            <ErrorDisplay
              error={userError}
              onRetry={() => fetchUser()}
              onDismiss={() => {}}
              variant="card"
              showDetails={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Example 2: Form with Validation Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Form Submission with Validation Errors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Shows how validation errors are handled with field-specific error messages.
          </p>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
              />
              {submitError?.field === 'name' && (
                <ValidationError error={submitError} />
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
              />
              {submitError?.field === 'email' && (
                <ValidationError error={submitError} />
              )}
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              Submit Form
            </Button>
          </form>

          {submitResult && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Form submitted successfully!
                <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(submitResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {submitError && !submitError.field && (
            <ErrorDisplay
              error={submitError}
              onRetry={() => submitForm(new FormData())}
              variant="card"
            />
          )}
        </CardContent>
      </Card>

      {/* Example 3: File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            File Upload with Error Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Demonstrates file upload error handling with file type validation, size limits, and progress feedback.
          </p>
          
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading file...
            </div>
          )}

          {uploadResult && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                File uploaded successfully!
                <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(uploadResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          {uploadError && (
            <FileUploadError 
              error={uploadError}
              onRetry={() => {
                const input = document.getElementById('file-upload') as HTMLInputElement;
                if (input && input.files?.[0]) {
                  uploadFile(input.files[0]);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Example 4: Retry Logic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Retry Logic with Exponential Backoff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Demonstrates automatic retry logic with exponential backoff for transient errors.
          </p>
          
          <Button 
            onClick={() => executeWithRetry()}
            disabled={loadingRetry}
            className="flex items-center gap-2"
          >
            {loadingRetry && <RefreshCw className="w-4 h-4 animate-spin" />}
            Test Retry Logic
          </Button>

          {retryData && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Retry succeeded after multiple attempts!
              </AlertDescription>
            </Alert>
          )}

          {retryError && (
            <ErrorDisplay
              error={retryError}
              onRetry={() => executeWithRetry()}
              variant="card"
              showDetails={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>API Error Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Test various error scenarios to see how the error handling system responds.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tests.map((test) => {
              const result = testResults.find(r => r.test === test.name);
              const status = result?.status || 'pending';
              
              return (
                <div key={test.name} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{test.name}</span>
                    <Badge 
                      variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
                    >
                      {status}
                    </Badge>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runTest(test.name, test.fn)}
                    disabled={status === 'pending'}
                    className="w-full"
                  >
                    Test
                  </Button>
                  
                  {result?.error && (
                    <div className="mt-2 text-xs">
                      <p className="text-red-600">{result.error.message}</p>
                      <p className="text-gray-500">Code: {result.error.code}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiErrorHandlingExample;
