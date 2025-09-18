'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NetworkErrorHandler } from '@/components/features/network-error-handler';
import { OfflineIndicator } from '@/components/features/offline-indicator';
import { useUIStore } from '@/stores/uiStore';
import { ErrorHandler } from '@/utils/error-handler';

export interface AppError {
  id: string;
  type: 'network' | 'api' | 'validation' | 'unknown';
  message: string;
  details?: string;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Partial<AppError>) => string;
  removeError: (id: string) => void;
  retryError: (id: string) => Promise<void>;
  clearErrors: () => void;
  handleError: (error: Error, context?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  defaultRetries?: number;
  onError?: (error: AppError) => void;
}

export function ErrorProvider({
  children,
  maxErrors = 5,
  defaultRetries = 3,
  onError,
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const { addNotification } = useUIStore();

  const addError = useCallback((errorData: Partial<AppError>): string => {
    const error: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'unknown',
      message: 'An unexpected error occurred',
      timestamp: new Date(),
      retryable: false,
      retryCount: 0,
      maxRetries: defaultRetries,
      ...errorData,
    };

    setErrors(prev => {
      const newErrors = [error, ...prev];
      // Keep only the most recent errors
      return newErrors.slice(0, maxErrors);
    });

    // Call custom error handler
    onError?.(error);

    // Show notification for user-facing errors
    if (error.type !== 'validation') {
      addNotification({
        type: 'error',
        title: getErrorTitle(error.type),
        message: error.message,
        duration: error.retryable ? 8000 : 5000,
      });
    }

    return error.id;
  }, [maxErrors, defaultRetries, onError, addNotification]);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const retryError = useCallback(async (id: string) => {
    const error = errors.find(e => e.id === id);
    if (!error || !error.retryable || error.retryCount >= error.maxRetries) {
      return;
    }

    // Update retry count
    setErrors(prev => prev.map(e => 
      e.id === id 
        ? { ...e, retryCount: e.retryCount + 1 }
        : e
    ));

    // Here you would implement the actual retry logic
    // This is a placeholder - in a real app, you'd store the original action
    addNotification({
      type: 'info',
      title: 'Retrying...',
      message: 'Attempting to retry the failed operation',
    });
  }, [errors, addNotification]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleError = useCallback((error: Error, context?: string) => {
    // Log error for debugging
    ErrorHandler.logError(error, context || 'ErrorProvider');

    // Determine error type
    const errorType = determineErrorType(error);
    
    // Add to error list
    addError({
      type: errorType,
      message: getErrorMessage(error, errorType),
      details: error.stack,
      retryable: isRetryableError(error, errorType),
    });
  }, [addError]);

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    retryError,
    clearErrors,
    handleError,
  };

  return (
    <ErrorContext.Provider value={value}>
      <ErrorBoundary onError={(error, errorInfo) => {
        handleError(error, 'ErrorBoundary');
        
        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
        }
      }}>
        {children}
        
        {/* Global error indicators */}
        <OfflineIndicator />
        
        {/* Network error handlers */}
        {errors
          .filter(error => error.type === 'network' && error.retryable)
          .slice(0, 1) // Show only the most recent network error
          .map(error => (
            <div key={error.id} className="fixed bottom-4 right-4 z-50 max-w-md">
              <NetworkErrorHandler
                error={new Error(error.message)}
                onRetry={() => retryError(error.id)}
                onDismiss={() => removeError(error.id)}
              />
            </div>
          ))
        }
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
}

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Helper functions
function determineErrorType(error: Error): AppError['type'] {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  if (message.includes('api') || message.includes('server') || message.includes('http')) {
    return 'api';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation';
  }
  
  return 'unknown';
}

function getErrorMessage(error: Error, type: AppError['type']): string {
  switch (type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection.';
    case 'api':
      return 'The server encountered an error. Please try again later.';
    case 'validation':
      return error.message; // Use original message for validation errors
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

function getErrorTitle(type: AppError['type']): string {
  switch (type) {
    case 'network':
      return 'Connection Error';
    case 'api':
      return 'Server Error';
    case 'validation':
      return 'Validation Error';
    default:
      return 'Error';
  }
}

function isRetryableError(error: Error, type: AppError['type']): boolean {
  switch (type) {
    case 'network':
    case 'api':
      return true;
    case 'validation':
      return false;
    default:
      // Check if it's a temporary error
      const message = error.message.toLowerCase();
      return message.includes('timeout') || message.includes('temporary');
  }
}