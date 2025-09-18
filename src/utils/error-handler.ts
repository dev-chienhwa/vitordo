// Error handling utility functions

import { APIError } from '@/types/api';

export class ErrorHandler {
  static handleLLMError(error: any): string {
    if (error.code === 'RATE_LIMIT') {
      return 'Too many requests. Please try again later.';
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return 'Network connection failed. Please check your internet connection.';
    }
    
    if (error.code === 'UNAUTHORIZED') {
      return 'Invalid API key. Please check your configuration.';
    }
    
    if (error.code === 'QUOTA_EXCEEDED') {
      return 'API quota exceeded. Please try again later or upgrade your plan.';
    }
    
    if (error.code === 'INVALID_REQUEST') {
      return 'Invalid request format. Please try rephrasing your input.';
    }
    
    return 'An error occurred while processing your request. Please try again.';
  }
  
  static handleStorageError(error: any): string {
    if (error.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Please clear some data and try again.';
    }
    
    if (error.name === 'NotAllowedError') {
      return 'Storage access denied. Please check your browser settings.';
    }
    
    return 'Failed to save data. Please try again.';
  }
  
  static handleNetworkError(error: any): string {
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. Please check if the service is available.';
    }
    
    if (error.code === 'ETIMEDOUT') {
      return 'Request timed out. Please try again.';
    }
    
    if (error.code === 'ENOTFOUND') {
      return 'Service not found. Please check your network connection.';
    }
    
    return 'Network error occurred. Please check your connection and try again.';
  }
  
  static createAPIError(
    code: string,
    message: string,
    details?: Record<string, any>
  ): APIError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }
  
  static logError(error: Error | APIError, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: 'stack' in error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }
    
    // In production, you might want to send to an error tracking service
    // Example: Sentry, LogRocket, etc.
  }
  
  static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMIT',
      'INTERNAL_SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
    ];
    
    return retryableCodes.includes(error.code);
  }
  
  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCodes = ['UNAUTHORIZED', 'FORBIDDEN'];
    const highCodes = ['QUOTA_EXCEEDED', 'INVALID_REQUEST'];
    const mediumCodes = ['RATE_LIMIT', 'NETWORK_ERROR'];
    
    if (criticalCodes.includes(error.code)) return 'critical';
    if (highCodes.includes(error.code)) return 'high';
    if (mediumCodes.includes(error.code)) return 'medium';
    
    return 'low';
  }
}