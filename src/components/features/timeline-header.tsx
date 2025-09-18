'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Calendar, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TimelineHeaderProps {
  title?: string;
  className?: string;
  animated?: boolean;
  showFilters?: boolean;
  showOptions?: boolean;
  onFilterClick?: () => void;
  onOptionsClick?: () => void;
  taskCount?: number;
}

export function TimelineHeader({
  title = 'Your Timeline',
  className,
  animated = true,
  showFilters = true,
  showOptions = true,
  onFilterClick,
  onOptionsClick,
  taskCount,
}: TimelineHeaderProps) {
  const content = (
    <div className={cn(
      'flex items-center justify-between p-6 border-b border-gray-200',
      'bg-white/80 backdrop-blur-sm',
      className
    )}>
      {/* Title Section */}
      <div className="flex items-center space-x-3">
        <Calendar className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          {taskCount !== undefined && (
            <p className="text-sm text-gray-500">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {showFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFilterClick}
            className="text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        )}
        
        {showOptions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOptionsClick}
            className="text-gray-600 hover:text-gray-900"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (animated) {
    return (
      <AnimatedContainer
        direction="down"
        delay={0.1}
        duration={0.5}
      >
        {content}
      </AnimatedContainer>
    );
  }

  return content;
}