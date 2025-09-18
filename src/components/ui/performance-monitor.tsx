'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { usePerformanceMonitor, useMemoryMonitor } from '@/hooks/usePerformance';
import { useLLMCache } from '@/services/llmCacheService';
import { useCache } from '@/services/cacheService';
import { 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';

export interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceMonitor({
  className,
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000,
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  
  const { getStats: getPerformanceStats } = usePerformanceMonitor('PerformanceMonitor');
  const { memoryInfo, getMemoryUsagePercentage } = useMemoryMonitor();
  const { getCacheStats: getLLMCacheStats, optimizeCache: optimizeLLMCache } = useLLMCache();
  const { getStats: getCacheStats, cleanup: cleanupCache } = useCache();

  // Collect performance data
  const collectPerformanceData = React.useCallback(() => {
    const performanceStats = getPerformanceStats();
    const llmCacheStats = getLLMCacheStats();
    const cacheStats = getCacheStats();
    const memoryUsage = getMemoryUsagePercentage();

    // Web Vitals (if available)
    const webVitals = {
      fcp: 0, // First Contentful Paint
      lcp: 0, // Largest Contentful Paint
      fid: 0, // First Input Delay
      cls: 0, // Cumulative Layout Shift
    };

    // Try to get Web Vitals from Performance Observer
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              webVitals.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              webVitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              webVitals.fid = (entry as any).processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              webVitals.cls += (entry as any).value;
            }
          });
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not supported');
      }
    }

    setPerformanceData({
      performance: performanceStats,
      llmCache: llmCacheStats,
      cache: cacheStats,
      memory: {
        info: memoryInfo,
        usagePercentage: memoryUsage,
      },
      webVitals,
      timestamp: Date.now(),
    });
  }, [getPerformanceStats, getLLMCacheStats, getCacheStats, getMemoryUsagePercentage, memoryInfo]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && isVisible) {
      const interval = setInterval(collectPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isVisible, refreshInterval, collectPerformanceData]);

  // Initial data collection
  useEffect(() => {
    if (isVisible) {
      collectPerformanceData();
    }
  }, [isVisible, collectPerformanceData]);

  const handleOptimizeCache = async () => {
    await optimizeLLMCache();
    cleanupCache();
    collectPerformanceData();
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className={`fixed bottom-4 left-4 z-50 ${className}`}
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-md ${className}`}>
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Performance Monitor
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={collectPerformanceData}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {performanceData && (
            <>
              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Database className="w-4 h-4 mr-1" />
                    Memory Usage
                  </span>
                  <span className="text-sm text-gray-600">
                    {performanceData.memory.usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      performanceData.memory.usagePercentage > 80
                        ? 'bg-red-500'
                        : performanceData.memory.usagePercentage > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(performanceData.memory.usagePercentage, 100)}%` }}
                  />
                </div>
                {performanceData.memory.info && (
                  <div className="text-xs text-gray-500">
                    {(performanceData.memory.info.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / 
                    {(performanceData.memory.info.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB
                  </div>
                )}
              </div>

              {/* Cache Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">LLM Cache</div>
                  <div className="text-xs text-gray-600">
                    Entries: {performanceData.llmCache.totalEntries}
                  </div>
                  <div className="text-xs text-gray-600">
                    Hit Rate: {performanceData.llmCache.hitRate.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">General Cache</div>
                  <div className="text-xs text-gray-600">
                    Entries: {performanceData.cache.size}
                  </div>
                  <div className="text-xs text-gray-600">
                    Size: {(performanceData.llmCache.memoryUsage / 1024).toFixed(1)}KB
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {showDetails && (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Performance Metrics
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Renders: {performanceData.performance.renderCount}</div>
                    <div>Avg Render: {performanceData.performance.averageRenderTime.toFixed(1)}ms</div>
                    <div>FCP: {performanceData.webVitals.fcp.toFixed(0)}ms</div>
                    <div>LCP: {performanceData.webVitals.lcp.toFixed(0)}ms</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleOptimizeCache}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Optimize
                </Button>
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  variant="outline"
                  size="sm"
                >
                  <Info className="w-3 h-3" />
                </Button>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-gray-500 text-center">
                Last updated: {new Date(performanceData.timestamp).toLocaleTimeString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Performance metrics hook for components
export function useComponentPerformance(componentName: string) {
  const { getStats } = usePerformanceMonitor(componentName);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [getStats]);

  return metrics;
}