'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingOverlay, useGlobalLoading } from '@/components/ui/loading-overlay';
import { ActionFeedback, useActionFeedback } from '@/components/ui/action-feedback';
import { useError } from '@/components/providers/error-provider';
import { useCache } from '@/services/cacheService';
import { useOfflineStatus } from '@/components/features/offline-indicator';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';

export default function ErrorHandlingDemo() {
  const [simulatedError, setSimulatedError] = useState<Error | null>(null);
  const { handleError, errors, clearErrors, retryError } = useError();
  const { feedback, showSuccess, showError, showWarning, showInfo, showLoading, hideFeedback } = useActionFeedback();
  const { setLoading, isLoading, clearLoading } = useGlobalLoading();
  const { getCached, setCached, clearCache, getStats } = useCache();
  const { isOnline, queueAction, queuedActionsCount, processOfflineQueue } = useOfflineStatus();

  // Simulate different types of errors
  const simulateNetworkError = () => {
    const error = new Error('Failed to fetch data from server');
    handleError(error, 'Network simulation');
    setSimulatedError(error);
  };

  const simulateAPIError = () => {
    const error = new Error('API returned 500 Internal Server Error');
    handleError(error, 'API simulation');
    setSimulatedError(error);
  };

  const simulateValidationError = () => {
    const error = new Error('Invalid input: Email address is required');
    handleError(error, 'Validation simulation');
    setSimulatedError(error);
  };

  const simulateUnknownError = () => {
    const error = new Error('Something unexpected happened');
    handleError(error, 'Unknown simulation');
    setSimulatedError(error);
  };

  // Simulate loading states
  const simulateLoading = async (key: string, duration: number = 2000) => {
    setLoading(key, true);
    showLoading(`Loading ${key}...`);
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    setLoading(key, false);
    hideFeedback();
    showSuccess(`${key} loaded successfully!`);
  };

  // Cache operations
  const testCache = async () => {
    const testData = { message: 'Hello from cache!', timestamp: Date.now() };
    await setCached('test_data', testData, 60000); // 1 minute TTL
    showSuccess('Data cached successfully');
  };

  const readCache = () => {
    const data = getCached('test_data');
    if (data) {
      showInfo(`Cached data: ${JSON.stringify(data)}`);
    } else {
      showWarning('No cached data found');
    }
  };

  // Offline queue operations
  const addToOfflineQueue = () => {
    queueAction(async () => {
      console.log('Executing queued action...');
      showSuccess('Queued action executed!');
    });
    showInfo('Action added to offline queue');
  };

  const cacheStats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Error Handling & UX Demo</h1>
        
        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <span>Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-sm text-gray-600">
                  {isOnline 
                    ? 'All features are available' 
                    : `${queuedActionsCount} actions queued for when you're back online`
                  }
                </p>
              </div>
              {!isOnline && queuedActionsCount > 0 && (
                <Button onClick={processOfflineQueue} variant="outline">
                  Process Queue ({queuedActionsCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Simulation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span>Error Simulation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Button onClick={simulateNetworkError} variant="outline" className="text-red-600">
                Network Error
              </Button>
              <Button onClick={simulateAPIError} variant="outline" className="text-orange-600">
                API Error
              </Button>
              <Button onClick={simulateValidationError} variant="outline" className="text-yellow-600">
                Validation Error
              </Button>
              <Button onClick={simulateUnknownError} variant="outline" className="text-gray-600">
                Unknown Error
              </Button>
            </div>
            
            {errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Recent Errors ({errors.length})</h4>
                  <Button onClick={clearErrors} size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                {errors.slice(0, 3).map((error) => (
                  <div key={error.id} className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800">{error.message}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {error.type} • {error.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {error.retryable && error.retryCount < error.maxRetries && (
                        <Button
                          onClick={() => retryError(error.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry ({error.maxRetries - error.retryCount})
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Button 
                onClick={() => simulateLoading('tasks')} 
                disabled={isLoading('tasks')}
                variant="outline"
              >
                {isLoading('tasks') ? 'Loading...' : 'Load Tasks'}
              </Button>
              <Button 
                onClick={() => simulateLoading('profile')} 
                disabled={isLoading('profile')}
                variant="outline"
              >
                {isLoading('profile') ? 'Loading...' : 'Load Profile'}
              </Button>
              <Button 
                onClick={() => simulateLoading('settings')} 
                disabled={isLoading('settings')}
                variant="outline"
              >
                {isLoading('settings') ? 'Loading...' : 'Load Settings'}
              </Button>
              <Button 
                onClick={() => clearLoading()} 
                variant="outline"
                className="text-gray-600"
              >
                Clear All Loading
              </Button>
            </div>

            <LoadingOverlay 
              isLoading={isLoading()} 
              message="Processing your request..."
              className="h-32 bg-gray-100 rounded-md"
            >
              <div className="h-32 flex items-center justify-center text-gray-500">
                Content area - will be covered by loading overlay
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>

        {/* Action Feedback */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Action Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button onClick={() => showSuccess('Operation completed!')} variant="outline" className="text-green-600">
                Success
              </Button>
              <Button onClick={() => showError('Something went wrong!')} variant="outline" className="text-red-600">
                Error
              </Button>
              <Button onClick={() => showWarning('Please check your input')} variant="outline" className="text-yellow-600">
                Warning
              </Button>
              <Button onClick={() => showInfo('Here is some information')} variant="outline" className="text-blue-600">
                Info
              </Button>
              <Button onClick={() => showLoading('Processing...')} variant="outline" className="text-gray-600">
                Loading
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cache Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Cache Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Button onClick={testCache} variant="outline">
                Write Cache
              </Button>
              <Button onClick={readCache} variant="outline">
                Read Cache
              </Button>
              <Button onClick={addToOfflineQueue} variant="outline">
                Queue Action
              </Button>
              <Button onClick={clearCache} variant="outline" className="text-red-600">
                Clear Cache
              </Button>
            </div>

            <div className="bg-gray-100 rounded-md p-4">
              <h4 className="font-medium text-gray-900 mb-2">Cache Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entries:</span>
                  <span className="ml-2 font-medium">{cacheStats.size}/{cacheStats.maxSize}</span>
                </div>
                <div>
                  <span className="text-gray-600">Hit Rate:</span>
                  <span className="ml-2 font-medium">{cacheStats.hitRate.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Offline Queue:</span>
                  <span className="ml-2 font-medium">{queuedActionsCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Error Display */}
        {simulatedError && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Current Simulated Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-800 font-medium">{simulatedError.message}</p>
                <Button 
                  onClick={() => setSimulatedError(null)} 
                  size="sm" 
                  variant="ghost" 
                  className="mt-2 text-red-600"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Feedback Component */}
      <ActionFeedback
        type={feedback.type}
        message={feedback.message}
        isVisible={feedback.isVisible}
        onHide={hideFeedback}
      />
    </div>
  );
}