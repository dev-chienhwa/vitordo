'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PerformanceMonitor } from '@/components/ui/performance-monitor';
import { LazyImage, withLazyLoading } from '@/components/ui/lazy-component';
import { 
  useOptimizedSearch, 
  useVirtualScroll, 
  useBatchedState,
  useStableCallback
} from '@/hooks/usePerformance';
import { useLLMCache } from '@/services/llmCacheService';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Zap, 
  Search, 
  List, 
  Image as ImageIcon,
  Database,
  Timer,
  TrendingUp
} from 'lucide-react';

// Lazy loaded heavy component
const HeavyComponent = withLazyLoading(
  () => import('./heavy-component'),
  { loadOnVisible: true }
);

// Generate sample data
const generateSampleData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `This is a description for item ${i + 1}. It contains some sample text to demonstrate search functionality.`,
    category: ['work', 'personal', 'urgent', 'low-priority'][i % 4],
    timestamp: new Date(Date.now() - Math.random() * 10000000000),
  }));
};

export default function PerformanceDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemCount, setItemCount] = useState(1000);
  const [showVirtualScroll, setShowVirtualScroll] = useState(false);
  const [showLazyImages, setShowLazyImages] = useState(false);
  const [batchedCounter, setBatchedCounter] = useBatchedState(0);

  // Generate sample data
  const sampleData = useMemo(() => generateSampleData(itemCount), [itemCount]);

  // Optimized search with debouncing and caching
  const { results: searchResults } = useOptimizedSearch(
    sampleData,
    (item, query) => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()),
    300
  );

  // Virtual scrolling for large lists
  const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll({
    items: searchResults,
    itemHeight: 80,
    containerHeight: 400,
    overscan: 5,
  });

  // LLM Cache demo
  const { getCacheStats, cacheResponse, getCachedResponse } = useLLMCache();
  const [cacheStats, setCacheStats] = useState(getCacheStats());

  // Debounced search
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Stable callback to prevent unnecessary re-renders
  const handleItemClick = useStableCallback((item: any) => {
    console.log('Item clicked:', item);
  }, []);

  // Simulate LLM cache operations
  const simulateLLMCache = async () => {
    const sampleInputs = [
      'Create a task for tomorrow',
      'Schedule a meeting next week',
      'Add a reminder for lunch',
      'Plan weekend activities',
    ];

    for (const input of sampleInputs) {
      const cached = await getCachedResponse(input);
      if (!cached) {
        // Simulate LLM response
        const mockResponse = {
          success: true,
          tasks: [{ title: `Task for: ${input}`, id: Date.now().toString() }],
        };
        await cacheResponse(input, mockResponse);
      }
    }

    setCacheStats(getCacheStats());
  };

  // Batch state updates
  const incrementBatchedCounter = () => {
    // These updates will be batched together
    setBatchedCounter(prev => prev + 1);
    setBatchedCounter(prev => prev + 1);
    setBatchedCounter(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Performance Optimization Demo</h1>

        {/* Performance Monitor */}
        <PerformanceMonitor showDetails={true} />

        {/* Search Optimization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span>Optimized Search with Debouncing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Item count"
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value))}
                  className="w-32"
                />
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Total items: {sampleData.length}</span>
                <span>Search results: {searchResults.length}</span>
                <span>Debounced query: "{debouncedQuery}"</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Virtual Scrolling */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <List className="w-5 h-5 text-green-600" />
              <span>Virtual Scrolling</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => setShowVirtualScroll(!showVirtualScroll)}
                variant="outline"
              >
                {showVirtualScroll ? 'Hide' : 'Show'} Virtual Scroll Demo
              </Button>

              {showVirtualScroll && (
                <div
                  className="border rounded-lg overflow-auto"
                  style={{ height: '400px' }}
                  onScroll={handleScroll}
                >
                  <div style={{ height: totalHeight, position: 'relative' }}>
                    <div style={{ transform: `translateY(${offsetY}px)` }}>
                      {visibleItems.map(({ item, index }) => (
                        <div
                          key={item.id}
                          className="flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer"
                          style={{ height: '80px' }}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-gray-600 truncate">{item.description}</p>
                            <span className="text-xs text-blue-600">{item.category}</span>
                          </div>
                          <div className="text-xs text-gray-500">#{index}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lazy Loading */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>Lazy Loading</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => setShowLazyImages(!showLazyImages)}
                variant="outline"
              >
                {showLazyImages ? 'Hide' : 'Show'} Lazy Images
              </Button>

              {showLazyImages && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <LazyImage
                      key={i}
                      src={`https://picsum.photos/200/200?random=${i}`}
                      alt={`Sample image ${i + 1}`}
                      placeholder="Loading..."
                      className="w-full h-32 rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div className="mt-4">
                <h4 className="font-medium mb-2">Lazy Component Loading</h4>
                <HeavyComponent />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-orange-600" />
              <span>LLM Cache Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={simulateLLMCache} variant="outline">
                Simulate LLM Cache Operations
              </Button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-100 p-3 rounded">
                  <div className="font-medium">Total Entries</div>
                  <div className="text-lg">{cacheStats.totalEntries}</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="font-medium">Hit Rate</div>
                  <div className="text-lg">{cacheStats.hitRate.toFixed(1)}%</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="font-medium">Total Hits</div>
                  <div className="text-lg">{cacheStats.totalHits}</div>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <div className="font-medium">Memory Usage</div>
                  <div className="text-lg">{(cacheStats.memoryUsage / 1024).toFixed(1)}KB</div>
                </div>
              </div>

              {cacheStats.topHitEntries.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Top Cache Entries</h4>
                  <div className="space-y-1">
                    {cacheStats.topHitEntries.slice(0, 3).map((entry, i) => (
                      <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="truncate">{entry.key}</span>
                        <span>{entry.hits} hits</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Batched State Updates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-red-600" />
              <span>Batched State Updates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button onClick={incrementBatchedCounter} variant="outline">
                  Increment Counter (+3)
                </Button>
                <span className="text-lg font-medium">Counter: {batchedCounter}</span>
              </div>
              <p className="text-sm text-gray-600">
                This button increments the counter 3 times, but the updates are batched together 
                to prevent unnecessary re-renders.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Performance Optimization Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Implemented Optimizations:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Debounced search input (300ms delay)</li>
                  <li>• Virtual scrolling for large lists</li>
                  <li>• Lazy loading of images and components</li>
                  <li>• LLM response caching with fuzzy matching</li>
                  <li>• Batched state updates</li>
                  <li>• Memoized callbacks and values</li>
                  <li>• Intersection Observer for visibility</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Performance Benefits:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Reduced API calls and network requests</li>
                  <li>• Improved rendering performance</li>
                  <li>• Lower memory usage</li>
                  <li>• Faster perceived load times</li>
                  <li>• Better user experience</li>
                  <li>• Reduced server load</li>
                  <li>• Optimized bundle size</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}