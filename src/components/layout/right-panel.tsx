'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Task } from '@/types/task';
import { TimelineHeader } from '@/components/features/timeline-header';
import { Timeline } from '@/components/features/timeline';
import { QuickStatusUpdate } from '@/components/features/quick-status-update';
import { AnimatedContainer } from '@/components/ui/animated-container';

export interface RightPanelProps {
  tasks: Task[];
  className?: string;
  animated?: boolean;
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onFilterClick?: () => void;
  onOptionsClick?: () => void;
  timelineTitle?: string;
  showFilters?: boolean;
  showOptions?: boolean;
  showQuickUpdate?: boolean;
  groupByStatus?: boolean;
}

export function RightPanel({
  tasks,
  className,
  animated = true,
  isLoading = false,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onFilterClick,
  onOptionsClick,
  timelineTitle,
  showFilters = true,
  showOptions = true,
  showQuickUpdate = true,
  groupByStatus = true,
}: RightPanelProps) {
  const content = (
    <div className={cn(
      'h-full flex flex-col bg-white',
      className
    )}>
      {/* Timeline Header */}
      <TimelineHeader
        title={timelineTitle}
        animated={animated}
        showFilters={showFilters}
        showOptions={showOptions}
        onFilterClick={onFilterClick}
        onOptionsClick={onOptionsClick}
        taskCount={tasks.length}
      />

      {/* Quick Status Update */}
      {showQuickUpdate && (
        <div className="px-6 py-3 border-b border-gray-100">
          <QuickStatusUpdate />
        </div>
      )}

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-6">
          <Timeline
            tasks={tasks}
            animated={animated}
            isLoading={isLoading}
            onTaskClick={onTaskClick}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            groupByStatus={groupByStatus}
          />
        </div>
      </div>
    </div>
  );

  if (animated) {
    return (
      <AnimatedContainer
        direction="right"
        duration={0.8}
        className="h-full"
      >
        {content}
      </AnimatedContainer>
    );
  }

  return content;
}