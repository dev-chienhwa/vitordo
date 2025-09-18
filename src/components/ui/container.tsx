'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({
  children,
  className,
  size = 'lg',
  center = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full px-4 sm:px-6 lg:px-8',
        containerSizes[size],
        center && 'mx-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const flexDirections = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

const alignItems = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyContent = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const gaps = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

export function Flex({
  children,
  className,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'none',
  ...props
}: FlexProps) {
  return (
    <div
      className={cn(
        'flex',
        flexDirections[direction],
        alignItems[align],
        justifyContent[justify],
        wrap && 'flex-wrap',
        gaps[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

export function Grid({
  children,
  className,
  cols = 1,
  gap = 'md',
  responsive = true,
  ...props
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        responsive ? `grid-cols-1 sm:${gridCols[cols]}` : gridCols[cols],
        gaps[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}