'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, AlertCircle, CheckCircle } from 'lucide-react';

export interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function OfflineIndicator({
  className,
  showWhenOnline = false,
  autoHide = true,
  autoHideDelay = 3000,
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOnlineMessage(false);
    } else if (wasOffline) {
      setShowOnlineMessage(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setShowOnlineMessage(false);
          setWasOffline(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, wasOffline, autoHide, autoHideDelay]);

  const shouldShow = !isOnline || (showWhenOnline && showOnlineMessage);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
            className
          )}
        >
          <div className={cn(
            'flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm',
            'border text-sm font-medium',
            isOnline 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}>
            {isOnline ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>You're back online!</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOnlineMessage(false);
                    setWasOffline(false);
                  }}
                  className="p-1 h-auto text-green-600 hover:text-green-700"
                >
                  ×
                </Button>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-600" />
                <span>You're offline. Some features may not work.</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Enhanced offline status hook with additional features
export function useOfflineStatus() {
  const isOnline = useOnlineStatus();
  const [offlineQueue, setOfflineQueue] = useState<Array<() => Promise<void>>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Process queued actions when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isProcessingQueue) {
      processOfflineQueue();
    }
  }, [isOnline, offlineQueue.length, isProcessingQueue]);

  const processOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    setIsProcessingQueue(true);
    
    try {
      // Process queued actions one by one
      for (const action of offlineQueue) {
        try {
          await action();
        } catch (error) {
          console.error('Failed to process queued action:', error);
        }
      }
      
      // Clear the queue after processing
      setOfflineQueue([]);
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const queueAction = (action: () => Promise<void>) => {
    setOfflineQueue(prev => [...prev, action]);
  };

  const clearQueue = () => {
    setOfflineQueue([]);
  };

  return {
    isOnline,
    isOffline: !isOnline,
    offlineQueue,
    queuedActionsCount: offlineQueue.length,
    isProcessingQueue,
    queueAction,
    clearQueue,
    processOfflineQueue,
  };
}