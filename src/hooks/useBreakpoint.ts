'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const breakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(): {
  current: Breakpoint;
  isAbove: (breakpoint: Breakpoint) => boolean;
  isBelow: (breakpoint: Breakpoint) => boolean;
  width: number;
} {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Set initial width
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCurrentBreakpoint = (): Breakpoint => {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    return 'sm';
  };

  const isAbove = (breakpoint: Breakpoint): boolean => {
    return width >= breakpoints[breakpoint];
  };

  const isBelow = (breakpoint: Breakpoint): boolean => {
    return width < breakpoints[breakpoint];
  };

  return {
    current: getCurrentBreakpoint(),
    isAbove,
    isBelow,
    width,
  };
}

export function useIsMobile(): boolean {
  const { isBelow } = useBreakpoint();
  return isBelow('lg');
}

export function useIsTablet(): boolean {
  const { isAbove, isBelow } = useBreakpoint();
  return isAbove('md') && isBelow('lg');
}

export function useIsDesktop(): boolean {
  const { isAbove } = useBreakpoint();
  return isAbove('lg');
}