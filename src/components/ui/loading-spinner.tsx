'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { LoadingSpinnerProps } from '@/types/ui';

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({
  size = 'md',
  color = 'currentColor',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent',
        spinnerSizes[size],
        className
      )}
      style={{
        borderTopColor: color,
        borderRightColor: color,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
    </div>
  );
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn('flex space-x-2', className)}>
      <div className="w-3 h-3 bg-current rounded-full animate-pulse"></div>
      <div className="w-3 h-3 bg-current rounded-full animate-pulse [animation-delay:0.2s]"></div>
      <div className="w-3 h-3 bg-current rounded-full animate-pulse [animation-delay:0.4s]"></div>
    </div>
  );
}