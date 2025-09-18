'use client';

import React, { useState } from 'react';
import { StatusRing } from '@/components/features/status-ring';
import { TimelineStatus } from '@/types/task';

export default function StatusRingDemo() {
  const [currentStatus, setCurrentStatus] = useState<TimelineStatus>(TimelineStatus.UPCOMING);
  const [animated, setAnimated] = useState(true);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">StatusRing Component Demo</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
          
          <div className="flex items-center justify-center mb-8 p-8 bg-gray-100 rounded-lg">
            <StatusRing 
              status={currentStatus} 
              animated={animated} 
              size={size}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select 
                value={currentStatus} 
                onChange={(e) => setCurrentStatus(e.target.value as TimelineStatus)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value={TimelineStatus.UPCOMING}>Upcoming</option>
                <option value={TimelineStatus.RECENTLY_COMPLETED}>Recently Completed</option>
                <option value={TimelineStatus.COMPLETED}>Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select 
                value={size} 
                onChange={(e) => setSize(e.target.value as 'sm' | 'md' | 'lg')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animation
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={animated} 
                  onChange={(e) => setAnimated(e.target.checked)}
                  className="mr-2"
                />
                Enable animations
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">All Status Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Upcoming</h3>
              <div className="flex justify-center mb-2">
                <StatusRing status={TimelineStatus.UPCOMING} size="lg" />
              </div>
              <p className="text-sm text-gray-600">Gray-white ring for upcoming tasks</p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Recently Completed</h3>
              <div className="flex justify-center mb-2">
                <StatusRing status={TimelineStatus.RECENTLY_COMPLETED} size="lg" />
              </div>
              <p className="text-sm text-gray-600">Green ring with white checkmark</p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Completed</h3>
              <div className="flex justify-center mb-2">
                <StatusRing status={TimelineStatus.COMPLETED} size="lg" />
              </div>
              <p className="text-sm text-gray-600">Black ring for completed tasks</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Size Variations</h3>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <StatusRing status={TimelineStatus.RECENTLY_COMPLETED} size="sm" />
                <p className="text-xs text-gray-600 mt-1">Small</p>
              </div>
              <div className="text-center">
                <StatusRing status={TimelineStatus.RECENTLY_COMPLETED} size="md" />
                <p className="text-xs text-gray-600 mt-1">Medium</p>
              </div>
              <div className="text-center">
                <StatusRing status={TimelineStatus.RECENTLY_COMPLETED} size="lg" />
                <p className="text-xs text-gray-600 mt-1">Large</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}