'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useComponentPerformance } from '@/components/ui/performance-monitor';
import { Cpu, Activity } from 'lucide-react';

// Simulate a heavy computation
function heavyComputation(iterations: number = 1000000) {
  const start = performance.now();
  let result = 0;
  
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
  }
  
  const end = performance.now();
  return { result, duration: end - start };
}

// Generate complex data structure
function generateComplexData(size: number = 1000) {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    data: Array.from({ length: 100 }, (_, j) => ({
      value: Math.random() * 1000,
      timestamp: new Date(Date.now() - Math.random() * 10000000),
      metadata: {
        category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        priority: Math.floor(Math.random() * 5) + 1,
        tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, 
          (_, k) => `tag-${k}-${Math.random().toString(36).substr(2, 5)}`
        ),
      },
    })),
  }));
}

export default function HeavyComponent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [computationResult, setComputationResult] = useState<any>(null);
  const [complexData, setComplexData] = useState<any[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  
  const performanceMetrics = useComponentPerformance('HeavyComponent');

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setComplexData(generateComplexData(500));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const runHeavyComputation = async () => {
    setIsComputing(true);
    
    // Use setTimeout to prevent blocking the UI
    setTimeout(() => {
      const result = heavyComputation(2000000);
      setComputationResult(result);
      setIsComputing(false);
    }, 10);
  };

  const processComplexData = () => {
    const start = performance.now();
    
    // Simulate complex data processing
    const processed = complexData.map(item => ({
      ...item,
      summary: {
        totalValue: item.data.reduce((sum: number, d: any) => sum + d.value, 0),
        averageValue: item.data.reduce((sum: number, d: any) => sum + d.value, 0) / item.data.length,
        categoryCount: item.data.reduce((acc: any, d: any) => {
          acc[d.metadata.category] = (acc[d.metadata.category] || 0) + 1;
          return acc;
        }, {}),
        uniqueTags: [...new Set(item.data.flatMap((d: any) => d.metadata.tags))],
      },
    }));
    
    const end = performance.now();
    console.log(`Data processing took ${end - start}ms`);
    
    return processed;
  };

  if (!isLoaded) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading heavy component...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-red-600" />
          <span>Heavy Component (Lazy Loaded)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-medium">Data Items</div>
            <div className="text-lg">{complexData.length}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-medium">Total Data Points</div>
            <div className="text-lg">{complexData.length * 100}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-medium">Memory Usage</div>
            <div className="text-lg">~{Math.round(JSON.stringify(complexData).length / 1024)}KB</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-medium">Component Renders</div>
            <div className="text-lg">{performanceMetrics?.renderCount || 0}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={runHeavyComputation}
            disabled={isComputing}
            variant="outline"
            className="w-full"
          >
            {isComputing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Computing...
              </>
            ) : (
              'Run Heavy Computation'
            )}
          </Button>

          {computationResult && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="text-sm">
                <div><strong>Computation Result:</strong> {computationResult.result.toFixed(2)}</div>
                <div><strong>Duration:</strong> {computationResult.duration.toFixed(2)}ms</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={processComplexData}
            variant="outline"
            className="w-full"
          >
            Process Complex Data
          </Button>
        </div>

        {performanceMetrics && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="text-sm">
              <div><strong>Component Performance:</strong></div>
              <div>Renders: {performanceMetrics.renderCount}</div>
              <div>Average Render Time: {performanceMetrics.averageRenderTime?.toFixed(2)}ms</div>
              <div>Total Time: {performanceMetrics.totalTime}ms</div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          This component simulates heavy computations and large data processing.
          It's lazy loaded to improve initial page load performance.
        </div>
      </CardContent>
    </Card>
  );
}