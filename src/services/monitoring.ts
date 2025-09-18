/**
 * Performance Monitoring and Error Tracking Service
 */

import { env, features } from '@/config/env';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

// Error tracking interface
interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  context?: Record<string, any>;
}

// Web Vitals interface
interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private webVitals: WebVital[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializeErrorTracking();
      this.initializePerformanceObserver();
    }
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Initialize Web Vitals tracking
  private initializeWebVitals(): void {
    if (!features.analytics) return;

    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.onWebVital.bind(this));
      getFID(this.onWebVital.bind(this));
      getFCP(this.onWebVital.bind(this));
      getLCP(this.onWebVital.bind(this));
      getTTFB(this.onWebVital.bind(this));
    }).catch(error => {
      console.warn('Web Vitals not available:', error);
    });
  }

  // Web Vitals callback
  private onWebVital(metric: any): void {
    const webVital: WebVital = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    };

    this.webVitals.push(webVital);
    this.sendWebVital(webVital);
  }

  // Initialize error tracking
  private initializeErrorTracking(): void {
    if (!features.errorReporting) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: {
          type: 'unhandledrejection',
          reason: event.reason,
        },
      });
    });
  }

  // Initialize Performance Observer
  private initializePerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackMetric('navigation.domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.trackMetric('navigation.load', navEntry.loadEventEnd - navEntry.loadEventStart);
            this.trackMetric('navigation.domInteractive', navEntry.domInteractive - navEntry.navigationStart);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackMetric('resource.duration', resourceEntry.duration, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  // Track custom metric
  public trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    this.sendMetric(metric);
  }

  // Track error
  public trackError(error: Partial<ErrorEvent>): void {
    const errorEvent: ErrorEvent = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: error.timestamp || Date.now(),
      url: error.url || (typeof window !== 'undefined' ? window.location.href : ''),
      userAgent: error.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      context: error.context,
    };

    this.errors.push(errorEvent);
    this.sendError(errorEvent);
  }

  // Send metric to monitoring service
  private sendMetric(metric: PerformanceMetric): void {
    if (!features.analytics) return;

    // Send to analytics service (e.g., Google Analytics, Mixpanel)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        custom_map: metric.tags,
      });
    }

    // Send to custom monitoring endpoint
    this.sendToMonitoringEndpoint('/api/metrics', metric);
  }

  // Send Web Vital to monitoring service
  private sendWebVital(vital: WebVital): void {
    if (!features.analytics) return;

    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', vital.name, {
        value: Math.round(vital.name === 'CLS' ? vital.value * 1000 : vital.value),
        event_category: 'Web Vitals',
        event_label: vital.rating,
        non_interaction: true,
      });
    }

    // Send to custom monitoring endpoint
    this.sendToMonitoringEndpoint('/api/web-vitals', vital);
  }

  // Send error to monitoring service
  private sendError(error: ErrorEvent): void {
    if (!features.errorReporting) return;

    // Send to Sentry (if configured)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(error.message), {
        extra: error.context,
        tags: {
          url: error.url,
          userAgent: error.userAgent,
        },
      });
    }

    // Send to custom error tracking endpoint
    this.sendToMonitoringEndpoint('/api/errors', error);
  }

  // Send data to monitoring endpoint
  private sendToMonitoringEndpoint(endpoint: string, data: any): void {
    if (typeof fetch === 'undefined') return;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch(error => {
      console.warn(`Failed to send monitoring data to ${endpoint}:`, error);
    });
  }

  // Get performance summary
  public getPerformanceSummary(): {
    metrics: PerformanceMetric[];
    webVitals: WebVital[];
    errors: ErrorEvent[];
  } {
    return {
      metrics: [...this.metrics],
      webVitals: [...this.webVitals],
      errors: [...this.errors],
    };
  }

  // Clear stored data
  public clearData(): void {
    this.metrics = [];
    this.webVitals = [];
    this.errors = [];
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Utility functions for common tracking scenarios
export const trackPageView = (page: string): void => {
  monitoringService.trackMetric('page.view', 1, { page });
};

export const trackUserAction = (action: string, category?: string): void => {
  monitoringService.trackMetric('user.action', 1, { action, category });
};

export const trackAPICall = (endpoint: string, duration: number, status: number): void => {
  monitoringService.trackMetric('api.call', duration, { 
    endpoint, 
    status: status.toString(),
    success: status < 400 ? 'true' : 'false',
  });
};

export const trackLLMCall = (provider: string, duration: number, success: boolean): void => {
  monitoringService.trackMetric('llm.call', duration, { 
    provider, 
    success: success.toString(),
  });
};