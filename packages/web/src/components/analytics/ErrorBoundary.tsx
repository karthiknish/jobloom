"use client";

import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useErrorTracking, errorTracking } from "@/lib/analytics/error-tracking";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo; onRetry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  componentName?: string;
  showToast?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };

    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Generate error ID for tracking
    const errorId = this.generateErrorId(error);
    this.setState({ errorId });

    // Track error using the error tracking service
    const errorTracking = (window as any).__errorTracking || { trackError: () => {} };
    
    errorTracking.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      componentName: this.props.componentName || 'Unknown',
      errorId,
    }, {
      category: 'client_error',
      severity: 'high',
      component: this.props.componentName || 'error_boundary',
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Error info:', errorInfo);
    }
  }

  private generateErrorId(error: Error): string {
    const message = error.message || 'Unknown error';
    const name = error.name || 'Error';
    const stack = error.stack || '';
    const timestamp = Date.now();
    
    // Create a hash-like identifier
    const hash = btoa(`${name}:${message}:${stack.substring(0, 200)}`).substring(0, 12);
    return `EB_${timestamp}_${hash}`;
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    // Critical errors that likely prevent core functionality
    if (message.includes('cannot read') && message.includes('undefined') ||
        message.includes('is not a function') ||
        message.includes('maximum call stack')) {
      return 'critical';
    }
    
    // High severity errors
    if (message.includes('authentication') || 
        message.includes('unauthorized') || 
        message.includes('forbidden') ||
        error.name.includes('ChunkLoad')) {
      return 'high';
    }
    
    // Medium severity
    if (message.includes('timeout') || 
        message.includes('network') || 
        message.includes('server')) {
      return 'medium';
    }
    
    return 'low';
  };

  private getErrorCategory = (error: Error): string => {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('chunkload') || message.includes('loading chunk')) {
      return 'Code Loading Error';
    }
    
    if (message.includes('hydration')) {
      return 'Hydration Error';
    }
    
    if (message.includes('network') || name.includes('fetch')) {
      return 'Network Error';
    }
    
    if (message.includes('permission') || message.includes('access denied')) {
      return 'Permission Error';
    }
    
    if (name.includes('reference')) {
      return 'Reference Error';
    }
    
    if (name.includes('type')) {
      return 'Type Error';
    }
    
    if (name.includes('syntax')) {
      return 'Syntax Error';
    }
    
    return 'General Error';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo!}
            onRetry={this.handleRetry}
          />
        );
      }

      // Default fallback UI
      return (
        <StandardErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.handleRetry}
          severity={this.getErrorSeverity(this.state.error)}
          category={this.getErrorCategory(this.state.error)}
          componentName={this.props.componentName}
        />
      );
    }

    return this.props.children;
  }
}

// Standard error fallback component
function StandardErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  severity,
  category,
  componentName,
}: {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  componentName?: string;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical': return '[!!]';
      case 'high': return '[!]';
      case 'medium': return '[*]';
      case 'low': return '[i]';
      default: return '[?]';
    }
  };

  const canRetry = retryCount < maxRetries;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mb-4 text-4xl">{getSeverityIcon()}</div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <CardDescription>
            {severity === 'critical' 
              ? 'A critical error occurred. Please refresh the page.'
              : 'An unexpected error occurred. Try clicking the button below to refresh this component.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Badge variant={getSeverityColor()}>
              {severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {category}
            </Badge>
            {componentName && (
              <Badge variant="outline">
                {componentName}
              </Badge>
            )}
          </div>

          {canRetry && (
            <div className="text-center space-y-2">
              <Button onClick={onRetry} className="w-full sm:w-auto">
                Try Again {retryCount > 0 && `(Attempt ${retryCount + 1}/${maxRetries})`}
              </Button>
              <p className="text-sm text-gray-500">
                If this problem continues, please contact support.
              </p>
            </div>
          )}

          {!canRetry && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Maximum retry attempts reached. Please refresh the page or contact support.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          )}

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2"
              >
                {showDetails ? 'Hide' : 'Show'} Error Details (Dev Mode)
              </Button>
              
              {showDetails && (
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Error ID:</strong> {errorId || 'N/A'}
                  </div>
                  <div>
                    <strong>Error:</strong> {error.name}: {error.message}
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                      {errorInfo?.componentStack}
                    </pre>
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errorId && (
            <div className="text-center text-xs text-gray-400">
              Error ID: {errorId}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook-based error boundary for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  const { trackError } = useErrorTracking();

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error, context?: Record<string, any>) => {
    trackError(error, context, {
      category: 'client_error',
      severity: 'medium',
      component: 'useErrorBoundary',
    });
    setError(error);
  }, [trackError]);

  if (error) {
    throw error;
  }

  return {
    captureError,
    resetError,
  };
}

// Provider to make error tracking available globally
export function ErrorTrackingProvider({ children }: { children: ReactNode }) {
  // Initialize error tracking service
  React.useEffect(() => {
    (window as any).__errorTracking = errorTracking;
  }, []);

  return <>{children}</>;
}
