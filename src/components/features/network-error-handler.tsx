'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useUIStore } from '@/stores/uiStore';
import { 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  Settings,
  HelpCircle,
  Loader2
} from 'lucide-react';

export interface NetworkErrorHandlerProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function NetworkErrorHandler({
  error,
  onRetry,
  onDismiss,
  className,
}: NetworkErrorHandlerProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const isOnline = useOnlineStatus();
  const { addNotification } = useUIStore();

  const maxRetries = 3;
  const canRetry = retryCount < maxRetries && isOnline;

  useEffect(() => {
    // Reset retry count when coming back online
    if (isOnline) {
      setRetryCount(0);
    }
  }, [isOnline]);

  const handleRetry = async () => {
    if (!canRetry || isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await onRetry?.();
      
      addNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'Successfully reconnected to the service',
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      
      if (retryCount >= maxRetries - 1) {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Unable to reconnect after multiple attempts',
        });
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorType = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'quota';
    }
    
    return 'unknown';
  };

  const getErrorInfo = (error: Error) => {
    const errorType = getErrorType(error);
    
    switch (errorType) {
      case 'network':
        return {
          title: 'Network Error',
          description: 'Unable to connect to the service. Please check your internet connection.',
          icon: WifiOff,
          color: 'text-red-600',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'Contact support if the problem persists',
          ],
        };
      case 'timeout':
        return {
          title: 'Request Timeout',
          description: 'The request took too long to complete. This might be due to slow internet or server issues.',
          icon: AlertCircle,
          color: 'text-yellow-600',
          suggestions: [
            'Try again with a shorter request',
            'Check your internet speed',
            'Wait a moment and retry',
          ],
        };
      case 'auth':
        return {
          title: 'Authentication Error',
          description: 'There was a problem with your API credentials. Please check your configuration.',
          icon: Settings,
          color: 'text-red-600',
          suggestions: [
            'Check your API key configuration',
            'Verify your account status',
            'Contact support for assistance',
          ],
        };
      case 'quota':
        return {
          title: 'Quota Exceeded',
          description: 'You have exceeded your API usage limits. Please wait or upgrade your plan.',
          icon: AlertCircle,
          color: 'text-orange-600',
          suggestions: [
            'Wait for your quota to reset',
            'Upgrade your API plan',
            'Reduce the frequency of requests',
          ],
        };
      default:
        return {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try again.',
          icon: HelpCircle,
          color: 'text-gray-600',
          suggestions: [
            'Try refreshing the page',
            'Clear your browser cache',
            'Contact support if the issue persists',
          ],
        };
    }
  };

  if (!error) return null;

  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  return (
    <AnimatedContainer direction="up" duration={0.3}>
      <Card className={cn('border-red-200 shadow-lg', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-full bg-red-100', errorInfo.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {errorInfo.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {errorInfo.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 p-3 rounded-md text-sm">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Technical Details
              </summary>
              <div className="space-y-1">
                <div><strong>Error:</strong> {error.message}</div>
                <div><strong>Type:</strong> {getErrorType(error)}</div>
                <div><strong>Retry Count:</strong> {retryCount}/{maxRetries}</div>
                <div><strong>Online:</strong> {isOnline ? 'Yes' : 'No'}</div>
              </div>
            </details>
          )}

          {/* Suggestions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">What you can try:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying || !isOnline}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({maxRetries - retryCount} left)
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={onDismiss}
              variant="secondary"
              size="sm"
              className={canRetry ? 'flex-1' : 'w-full'}
            >
              Dismiss
            </Button>
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <WifiOff className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                You&apos;re currently offline. Please check your internet connection.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}