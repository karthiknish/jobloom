/**
 * Error Boundary Component
 * Catches and displays errors in a user-friendly way
 */

import React, { Component, ReactNode } from 'react';
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in production
    if (process.env.NODE_ENV === 'production') {
      console.error('React Error Boundary caught error:', error.message);
    }
  }

  handleRetry = () => {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 text-center ${this.props.className}`}>
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50"
          >
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold mb-2">
            Something went wrong
          </h2>
          
          <p className="mb-6 max-w-md text-gray-500">
            An error occurred. Please try again.
          </p>

          {this.props.showRetry && this.retryCount < this.maxRetries && (
            <Button onClick={this.handleRetry} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Try Again
            </Button>
          )}

          {this.retryCount >= this.maxRetries && (
            <div className="mt-4">
              <Button
                variant="secondary"
                className="cursor-pointer text-sm hover:text-gray-700"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <div className="mt-8 w-full max-w-3xl text-left mx-auto">
              <div className="border border-red-200 rounded-xl overflow-hidden bg-white shadow-lg">
                <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-bold text-red-900">Developer Diagnostics</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-white hover:bg-red-100 border-red-200 text-red-700 font-bold shadow-sm transition-all active:scale-95"
                    onClick={() => {
                      const text = `Error: ${this.state.error?.message}\n\nStack Trace:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
                      navigator.clipboard.writeText(text);
                      // Simple visual feedback
                      const btn = document.activeElement as HTMLButtonElement;
                      if (btn) {
                        const originalText = btn.innerText;
                        btn.innerText = "Copied!";
                        setTimeout(() => { btn.innerText = originalText; }, 2000);
                      }
                    }}
                  >
                    Copy Full Error Report
                  </Button>
                </div>
                <div className="p-0 bg-slate-950 overflow-hidden">
                  <div className="flex border-b border-white/5 bg-white/5">
                    <div className="px-4 py-2 text-xxs font-bold text-white/40 uppercase tracking-widest border-r border-white/5">
                      Error Message
                    </div>
                  </div>
                  <div className="p-4 font-mono text-xs text-red-400 bg-red-950/20">
                    {this.state.error?.toString()}
                  </div>
                  
                  <div className="flex border-y border-white/5 bg-white/5">
                    <div className="px-4 py-2 text-xxs font-bold text-white/40 uppercase tracking-widest border-r border-white/5">
                      Component Stack Trace
                    </div>
                  </div>
                  <div className="p-4 font-mono text-xxs text-slate-400 overflow-auto max-h-[400px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </div>
              <p className="text-xxs text-center text-muted-foreground mt-3 italic">
                This diagnostic view is only visible in development mode.
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  className?: string;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
  showRetry = true,
  className
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={onError}
      showRetry={showRetry}
      className={className}
    >
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryWrapperProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryWrapper {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryWrapper>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
