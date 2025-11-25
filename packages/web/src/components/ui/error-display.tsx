/**
 * Error Display Component
 * Displays various types of errors with appropriate actions
 */

import React from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, Info as _Info, X, ExternalLink as _ExternalLink, CreditCard, Shield, FileText, WifiOff } from 'lucide-react';
import { FrontendApiError } from '@/lib/api/client';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { themeColors } from "@/styles/theme-colors";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  error: FrontendApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner' | 'modal';
  showIcon?: boolean;
  showDetails?: boolean;
}

interface ErrorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
  variant = 'card',
  showIcon = true,
  showDetails = false
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    const iconClass = "w-5 h-5";
    
    switch (error.category) {
      case 'authentication':
        return <Shield className={cn(iconClass, themeColors.error.icon)} />;
      case 'authorization':
        return <AlertCircle className={cn(iconClass, themeColors.warning.icon)} />;
      case 'validation':
        return <AlertTriangle className={cn(iconClass, themeColors.warning.icon)} />;
      case 'rate_limit':
        return <RefreshCw className={cn(iconClass, themeColors.info.icon)} />;
      case 'subscription':
        return <CreditCard className={cn(iconClass, themeColors.primary.text)} />;
      case 'file_upload':
        return <FileText className={cn(iconClass, themeColors.warning.icon)} />;
      case 'network':
        return <WifiOff className={cn(iconClass, themeColors.muted.text)} />;
      default:
        return <AlertCircle className={cn(iconClass, themeColors.error.icon)} />;
    }
  };

  const getErrorActions = (): ErrorAction[] => {
    const actions: ErrorAction[] = [];

    // Retry action
    if (error.shouldRetry && onRetry) {
      actions.push({
        label: error.retryAfter 
          ? `Retry (${Math.ceil(error.retryAfter! / 1000)}s)`
          : 'Retry',
        onClick: onRetry,
        variant: 'primary',
        icon: <RefreshCw className="w-4 h-4" />
      });
    }

    // Auth action
    if (error.requiresAuth) {
      actions.push({
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/sign-in';
        },
        variant: 'primary'
      });
    }

    // Payment action
    if (error.requiresPayment) {
      actions.push({
        label: 'Upgrade Plan',
        onClick: () => {
          window.location.href = '/upgrade';
        },
        variant: 'primary'
      });
    }

    // Dismiss action
    if (onDismiss) {
      actions.push({
        label: 'Dismiss',
        onClick: onDismiss,
        variant: 'outline',
        icon: <X className="w-4 h-4" />
      });
    }

    return actions;
  };

  const getSeverityColor = () => {
    switch (error.severity) {
      case 'critical':
        return cn(themeColors.error.border, themeColors.error.bg, themeColors.error.text);
      case 'high':
        return cn(themeColors.warning.border, themeColors.warning.bg, themeColors.warning.text);
      case 'medium':
        return cn(themeColors.warning.border, themeColors.warning.bg, themeColors.warning.text);
      case 'low':
        return cn(themeColors.info.border, themeColors.info.bg, themeColors.info.text);
      default:
        return cn(themeColors.muted.border, themeColors.muted.bg, themeColors.muted.text);
    }
  };

  const renderInline = () => (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${getSeverityColor()} ${className}`}>
      {showIcon && getErrorIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{error.message}</p>
        {error.field && (
          <p className="text-xs opacity-75">Field: {error.field}</p>
        )}
      </div>
      {getErrorActions().slice(0, 1).map((action, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="h-8 px-3"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );

  const renderCard = () => (
    <div className={`rounded-lg border p-6 ${getSeverityColor()} ${className}`}>
      <div className="flex items-start gap-4">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">
            {error.category === 'validation' ? 'Validation Error' :
             error.category === 'authentication' ? 'Authentication Required' :
             error.category === 'authorization' ? 'Access Denied' :
             error.category === 'rate_limit' ? 'Rate Limited' :
             error.category === 'subscription' ? 'Subscription Required' :
             error.category === 'file_upload' ? 'Upload Failed' :
             error.category === 'network' ? 'Network Error' :
             'Error'}
          </h3>
          
          <p className="text-sm mb-4">{error.message}</p>
          
          {error.field && (
            <p className="text-xs opacity-75 mb-4">
              Field: <span className="font-mono bg-white/50 px-2 py-1 rounded">{error.field}</span>
            </p>
          )}
          
          {showDetails && error.requestId && (
            <div className="text-xs opacity-75 mb-4">
              <p>Request ID: <span className="font-mono">{error.requestId}</span></p>
              <p>Error Code: <span className="font-mono">{error.code}</span></p>
              {error.timestamp && (
                <p>Time: {new Date(error.timestamp).toLocaleString()}</p>
              )}
            </div>
          )}
          
          {getErrorActions().length > 0 && (
            <div className="flex flex-wrap gap-2">
              {getErrorActions().map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant === 'primary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const renderBanner = () => (
    <div className={`border-l-4 p-4 ${getSeverityColor()} ${className}`}>
      <div className="flex items-center">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">
            {getErrorIcon()}
          </div>
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium">{error.message}</p>
          {error.field && (
            <p className="text-xs opacity-75 mt-1">Field: {error.field}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {getErrorActions().map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="h-8 px-3"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderModal = () => (
    <div className={`rounded-lg border p-6 ${getSeverityColor()} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {showIcon && getErrorIcon()}
          <h3 className="text-lg font-semibold">
            {error.category === 'validation' ? 'Validation Error' :
             error.category === 'authentication' ? 'Authentication Required' :
             error.category === 'authorization' ? 'Access Denied' :
             error.category === 'rate_limit' ? 'Rate Limited' :
             error.category === 'subscription' ? 'Subscription Required' :
             'Error'}
          </h3>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="mb-6">
        <p className="text-sm mb-4">{error.message}</p>
        
        {error.field && (
          <p className="text-xs opacity-75 mb-4">
            Field: <span className="font-mono bg-white/50 px-2 py-1 rounded">{error.field}</span>
          </p>
        )}
        
        {showDetails && (
          <div className="text-xs opacity-75 space-y-1">
            {error.requestId && (
              <p>Request ID: <span className="font-mono">{error.requestId}</span></p>
            )}
            <p>Error Code: <span className="font-mono">{error.code}</span></p>
            {error.timestamp && (
              <p>Time: {new Date(error.timestamp).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
      
      {getErrorActions().length > 0 && (
        <div className="flex justify-end gap-2">
          {getErrorActions().map((action, index) => (
            <Button
              key={index}
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              onClick={action.onClick}
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  switch (variant) {
    case 'inline':
      return renderInline();
    case 'banner':
      return renderBanner();
    case 'modal':
      return renderModal();
    default:
      return renderCard();
  }
}

// Specialized error components for common scenarios

export function AuthError({ error, onRetry, onDismiss }: { error: FrontendApiError; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      variant="banner"
      className="mb-4"
    />
  );
}

export function ValidationError({ error, onRetry }: { error: FrontendApiError; onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      variant="inline"
      className="mb-4"
      showIcon={true}
    />
  );
}

export function NetworkError({ error, onRetry }: { error: FrontendApiError; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <WifiOff className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
      <p className="text-gray-600 mb-6">{error.message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export function FileUploadError({ error, onRetry, onDismiss }: { error: FrontendApiError; onRetry?: () => void; onDismiss?: () => void }) {
  const getFileErrorSuggestions = () => {
    if (error.code?.includes('VALID_1104')) {
      return 'Try uploading a PDF, Word document, or plain text file.';
    }
    if (error.code?.includes('VALID_1105')) {
      return 'Try compressing the file or uploading a smaller version.';
    }
    return 'Please check the file and try again.';
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <FileText className="h-4 w-4" />
      <AlertTitle>Upload Failed</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        <p className="text-sm mt-2">{getFileErrorSuggestions()}</p>
        {error.field && (
          <p className="text-xs mt-1">Issue with: {error.field}</p>
        )}
        <div className="flex gap-2 mt-4">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function RateLimitError({ error, onDismiss }: { error: FrontendApiError; onDismiss?: () => void }) {
  const retryTime = error.retryAfter ? Math.ceil(error.retryAfter / 1000) : 60;
  
  return (
    <Alert className={cn("mb-4", themeColors.info.border, themeColors.info.bg, themeColors.info.text)}>
      <RefreshCw className="h-4 w-4" />
      <AlertTitle>Rate Limit Exceeded</AlertTitle>
      <AlertDescription>
  <p>You&apos;ve made too many requests. Please wait {retryTime} seconds before trying again.</p>
        <div className="flex gap-2 mt-4">
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Got it
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function SubscriptionError({ error, onDismiss }: { error: FrontendApiError; onDismiss?: () => void }) {
  return (
    <Alert className={cn("mb-4", themeColors.primary.border, themeColors.primary.bg, themeColors.primary.text)}>
      <CreditCard className="h-4 w-4" />
      <AlertTitle>Subscription Required</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => window.location.href = '/upgrade'}
          >
            Upgrade Plan
          </Button>
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Maybe Later
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default ErrorDisplay;
