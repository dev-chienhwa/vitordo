'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { LoadingSpinner, LoadingDots } from './loading-spinner';

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  overlay?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  variant = 'spinner',
  overlay = true,
  className,
  children,
}: LoadingOverlayProps) {
  const LoadingComponent = variant === 'dots' ? LoadingDots : LoadingSpinner;

  return (
    <div className={cn('relative', className)}>
      {children}
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex flex-col items-center justify-center',
              overlay && 'absolute inset-0 bg-white/80 backdrop-blur-sm z-10'
            )}
          >
            <div className="flex flex-col items-center space-y-3">
              {variant === 'pulse' ? (
                <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse" />
              ) : (
                <LoadingComponent size="lg" />
              )}
              
              {message && (
                <p className="text-sm text-gray-600 font-medium">
                  {message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Global loading state hook
export function useGlobalLoading() {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  };

  const isLoading = (key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(Boolean);
  };

  const clearLoading = (key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setLoadingStates({});
    }
  };

  return {
    setLoading,
    isLoading,
    clearLoading,
    loadingStates,
  };
}