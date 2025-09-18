'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from './button';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ThemeToggle({
  className,
  size = 'md',
  variant = 'ghost',
}: ThemeToggleProps) {
  const { themeName, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        className
      )}
      aria-label={`Switch to ${themeName === 'light' ? 'dark' : 'light'} theme`}
    >
      <Sun
        className={cn(
          'h-4 w-4 transition-all duration-200',
          themeName === 'light' 
            ? 'rotate-0 scale-100' 
            : '-rotate-90 scale-0'
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-200',
          themeName === 'light' 
            ? 'rotate-90 scale-0' 
            : 'rotate-0 scale-100'
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}