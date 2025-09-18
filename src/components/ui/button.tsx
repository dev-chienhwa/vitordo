'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { ButtonProps } from '@/types/ui';
import { LoadingSpinner } from './loading-spinner';

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
  ghost: 'hover:bg-gray-100 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Variant styles
        buttonVariants[variant],
        // Size styles
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <LoadingSpinner
          size={size === 'lg' ? 'md' : 'sm'}
          className="mr-2"
        />
      )}
      {children}
    </button>
  );
}