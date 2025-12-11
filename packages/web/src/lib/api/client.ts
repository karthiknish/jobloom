/**
 * Enhanced API Client for Frontend
 * Integrates with the standardized backend error handling system
 */

import { ERROR_CODES, ERROR_STATUS_MAP } from './errorCodes';

// Enhanced error interface matching backend response
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
    retryAfter?: number;
    timestamp: number;
    requestId: string;
    path?: string;
    method?: string;
  };
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
  timestamp: number;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Frontend error class with additional context
export class FrontendApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public requestId?: string,
    public field?: string,
    public details?: Record<string, any>,
    public retryAfter?: number,
    public timestamp?: number,
    public category?: string,
    public shouldRetry?: boolean,
    public requiresAuth?: boolean,
    public requiresPayment?: boolean,
    public severity?: string
  ) {
    super(message);
    this.name = 'FrontendApiError';
  }
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for better handling
export type ErrorCategory = 
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'network'
  | 'server'
  | 'rate_limit'
  | 'subscription'
  | 'file_upload'
  | 'business_logic'
  | 'not_found'
  | 'unknown';

// Error classification result
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  shouldRetry: boolean;
  retryDelay?: number;
  requiresAuth: boolean;
  requiresPayment: boolean;
  isFieldError: boolean;
}

// Request configuration
export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
}

// API response options
export interface ApiResponseOptions {
  showGlobalError?: boolean;
  showLocalError?: boolean;
  retryOnFailure?: boolean;
  customErrorHandler?: (error: FrontendApiError) => void;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Main API request method with comprehensive error handling
   */
  async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {},
    options: ApiResponseOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.maxRetries,
      retryDelay = this.baseRetryDelay,
      skipAuth = false,
      skipErrorHandler = false
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    let lastError: FrontendApiError | null = null;

    // Add authentication header if not skipped
    if (!skipAuth) {
      config.headers = {
        ...config.headers,
        'Authorization': await this.getAuthToken()
      };
    }

    // Set default headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Retry logic for transient errors
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, config, timeout);
        return response;
      } catch (error) {
        lastError = error as FrontendApiError;
        
        // Don't retry on non-transient errors
        if (!this.shouldRetryError(lastError) || attempt === retries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    // Handle final error
    if (!skipErrorHandler && lastError) {
      this.handleError(lastError, options);
    }

    throw lastError;
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest<T>(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw this.createFrontendError(errorData, response.status);
      }

      const responseData = await response.json();
      
      // Validate success response format
      if (responseData.success === false) {
        throw this.createFrontendError(responseData, response.status);
      }

      return responseData.data || responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof FrontendApiError) {
        throw error;
      }

      // Handle network errors, timeouts, etc.
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new FrontendApiError(
            'Request timeout',
            'SYS_1902',
            408,
            undefined,
            undefined,
            { originalError: error.message }
          );
        }

        throw new FrontendApiError(
          error.message || 'Network error',
          'NET_2000',
          0,
          undefined,
          undefined,
          { originalError: error.message }
        );
      }

      throw new FrontendApiError(
        'Unknown error occurred',
        'SYS_1900',
        500
      );
    }
  }

  /**
   * Parse error response from backend
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return {
        error: {
          message: response.statusText || 'Request failed',
          code: `HTTP_${response.status}`
        }
      };
    }
  }

  /**
   * Create frontend error from backend error response
   */
  private createFrontendError(errorData: any, status: number): FrontendApiError {
    // Handle null/undefined/empty error data
    if (!errorData || (typeof errorData === 'object' && Object.keys(errorData).length === 0)) {
      return new FrontendApiError(
        `Request failed with status ${status}`,
        `HTTP_${status}`,
        status
      );
    }

    if (errorData.error && typeof errorData.error === 'object') {
      // New standardized error format
      return new FrontendApiError(
        errorData.error.message || `Request failed with status ${status}`,
        errorData.error.code || `HTTP_${status}`,
        status,
        errorData.error.requestId,
        errorData.error.field,
        errorData.error.details,
        errorData.error.retryAfter,
        errorData.error.timestamp
      );
    } else {
      // Legacy error format
      return new FrontendApiError(
        errorData.message || errorData.error || `Request failed with status ${status}`,
        errorData.code || `HTTP_${status}`,
        status,
        undefined,
        undefined,
        errorData.details || (typeof errorData === 'object' ? errorData : undefined)
      );
    }
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetryError(error: FrontendApiError): boolean {
    // Never retry auth errors
    if (error.status === 401 || error.status === 403) {
      return false;
    }
    
    // Don't retry client errors (4xx) except rate limiting and timeout
    if (error.status >= 400 && error.status < 500) {
      return error.status === 429 || error.status === 408;
    }

    // Retry server errors and network errors
    return error.status >= 500 || error.status === 0;
  }

  /**
   * Handle errors based on configuration
   */
  private handleError(error: FrontendApiError, options: ApiResponseOptions): void {
    const classification = this.classifyError(error);

    // Log error for debugging with null-safe property access
    console.error('API Error:', {
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      status: error.status ?? 'N/A',
      requestId: error.requestId || 'N/A',
      field: error.field || undefined,
      details: error.details || undefined,
      classification: {
        category: classification.category,
        severity: classification.severity,
        shouldRetry: classification.shouldRetry
      }
    });

    // Call custom error handler if provided
    if (options.customErrorHandler) {
      options.customErrorHandler(error);
      return;
    }

    // Handle global errors (toast notifications, etc.)
    if (options.showGlobalError !== false) {
      this.handleGlobalError(error, classification);
    }

    // Handle auth errors
    if (classification.requiresAuth) {
      this.handleAuthError(error);
    }

    // Handle payment errors
    if (classification.requiresPayment) {
      this.handlePaymentError(error);
    }
  }

  /**
   * Classify error for appropriate handling
   */
  private classifyError(error: FrontendApiError): ErrorClassification {
    const code = error.code;
    const status = error.status;
    const message = error.message.toLowerCase();

    // Authentication errors
    if (code.startsWith('AUTH_') || status === 401) {
      return {
        category: 'authentication',
        severity: 'high',
        userMessage: 'Please sign in to continue',
        shouldRetry: false,
        requiresAuth: true,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Authorization errors
    if (code === 'AUTH_1004' || status === 403) {
      return {
        category: 'authorization',
        severity: 'high',
        userMessage: "You don't have permission to access this resource",
        shouldRetry: false,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Validation errors
    if (code.startsWith('VALID_') || status === 400) {
      return {
        category: 'validation',
        severity: 'medium',
        userMessage: error.field ? `${error.field}: ${error.message}` : error.message,
        shouldRetry: false,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: !!error.field
      };
    }

    // Rate limiting errors
    if (code === 'EXT_1706' || status === 429) {
      return {
        category: 'rate_limit',
        severity: 'medium',
        userMessage: 'Too many requests. Please wait before trying again.',
        shouldRetry: true,
        retryDelay: (error.retryAfter || 60) * 1000,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Subscription/payment errors
    if (code.startsWith('SUB_') || code.includes('PAYMENT') || status === 402) {
      return {
        category: 'subscription',
        severity: 'high',
        userMessage: 'Payment required. Please upgrade your plan to continue.',
        shouldRetry: false,
        requiresAuth: false,
        requiresPayment: true,
        isFieldError: false
      };
    }

    // File upload errors
    if (code.startsWith('CV_') || code.includes('FILE') || status === 413 || status === 415) {
      return {
        category: 'file_upload',
        severity: 'medium',
        userMessage: error.message || 'File upload failed. Please try again.',
        shouldRetry: false,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Not found errors
    if (code.startsWith('CONTENT_') || status === 404) {
      return {
        category: 'not_found',
        severity: 'low',
        userMessage: 'The requested resource was not found.',
        shouldRetry: false,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Server errors
    if (status >= 500 || code.startsWith('SYS_') || code.startsWith('DB_')) {
      return {
        category: 'server',
        severity: 'high',
        userMessage: 'Server error. Please try again later.',
        shouldRetry: true,
        retryDelay: 5000,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Network errors
    if (status === 0 || code.startsWith('NET_')) {
      return {
        category: 'network',
        severity: 'medium',
        userMessage: 'Network error. Please check your connection.',
        shouldRetry: true,
        retryDelay: 2000,
        requiresAuth: false,
        requiresPayment: false,
        isFieldError: false
      };
    }

    // Default/unknown errors
    return {
      category: 'unknown',
      severity: 'medium',
      userMessage: error.message || 'An unexpected error occurred.',
      shouldRetry: true,
      retryDelay: 2000,
      requiresAuth: false,
      requiresPayment: false,
      isFieldError: false
    };
  }

  /**
   * Handle global errors (toast notifications, etc.)
   */
  private handleGlobalError(error: FrontendApiError, classification: ErrorClassification): void {
    // This can be integrated with your toast system
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.error(classification.userMessage, {
        duration: classification.severity === 'high' ? 5000 : 3000
      });
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: FrontendApiError): void {
    // Redirect to login or trigger auth flow
    if (typeof window !== 'undefined') {
      // Store the current URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/sign-in';
    }
  }

  /**
   * Handle payment errors
   */
  private handlePaymentError(error: FrontendApiError): void {
    // Redirect to upgrade page or show payment modal
    if (typeof window !== 'undefined') {
      window.location.href = '/upgrade';
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    // This should integrate with your auth system
    if (typeof window !== 'undefined') {
      try {
        // Use the Firebase auth client
        const { getAuthClient } = await import('@/firebase/client');
        const auth = getAuthClient();
        if (auth?.currentUser) {
          const token = await auth.currentUser.getIdToken();
          return token ? `Bearer ${token}` : '';
        }
      } catch (error) {
        console.warn('[ApiClient] Failed to get token from Firebase auth client:', error);
      }
      
      // Fallback to legacy method
      const user = (window as any).firebase?.auth()?.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return token ? `Bearer ${token}` : '';
      }
    }
    return '';
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods for common HTTP operations
  async get<T = any>(endpoint: string, config?: ApiRequestConfig, options?: ApiResponseOptions): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' }, options);
  }

  async post<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig, options?: ApiResponseOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, options);
  }

  async put<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig, options?: ApiResponseOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, options);
  }

  async patch<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig, options?: ApiResponseOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }, options);
  }

  async delete<T = any>(endpoint: string, config?: ApiRequestConfig, options?: ApiResponseOptions): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' }, options);
  }

  // File upload method
  async upload<T = any>(endpoint: string, file: File, additionalData?: Record<string, any>, config?: ApiRequestConfig, options?: ApiResponseOptions): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Get CSRF token from cookie
    const csrfToken = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('__csrf-token='))?.split('=')[1]
      : undefined;

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData (browser sets it with boundary)
        ...(config?.headers ?? {}),
        'Authorization': await this.getAuthToken(),
        // Include CSRF token for security
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
      }
    }, options);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

export default apiClient;
