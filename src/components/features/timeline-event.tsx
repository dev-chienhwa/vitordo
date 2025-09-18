'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Task, TimelineStatus } from '@/types/task';
import { StatusRing } from './status-ring';
import { TaskActionsMenu } from './task-actions-menu';
import { AnimatedContainer, StaggerItem } from '@/components/ui/animated-container';
import { formatTimeRange, formatRelativeTime } from '@/utils/time';
import { Clock, Calendar, MoreHorizontal } from 'lucide-react';

export interface TimelineEventProps {
  task: Task;
  index?: number;
  className?: string;
  animated?: boolean;
  showTimeRange?: boolean;
  showRelativeTime?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  isLast?: boolean;
  showActions?: boolean;
}

export function TimelineEvent({
  task,
  index = 0,
  className,
  animated = true,
  showTimeRange = true,
  showRelativeTime = true,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  isLast = false,
  showActions = true,
}: TimelineEventProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const getEventStyles = () => {
    switch (task.status) {
      case TimelineStatus.COMPLETED:
        return {
          container: 'opacity-75 hover:opacity-100',
          content: 'text-gray-600',
          title: 'text-gray-800 text-sm',
          time: 'text-gray-500',
          line: 'bg-gray-300',
        };
      case TimelineStatus.RECENTLY_COMPLETED:
        return {
          container: 'opacity-100',
          content: 'text-gray-700',
          title: 'text-gray-900 font-medium',
          time: 'text-green-600 font-medium',
          line: 'bg-green-200',
        };
      case TimelineStatus.UPCOMING:
        return {
          container: 'opacity-90',
          content: 'text-gray-500',
          title: 'text-gray-700',
          time: 'text-gray-400',
          line: 'bg-gray-200',
        };
      default:
        return {
          container: 'opacity-90',
          content: 'text-gray-500',
          title: 'text-gray-700',
          time: 'text-gray-400',
          line: 'bg-gray-200',
        };
    }
  };

  const styles = getEventStyles();

  const handleClick = () => {
    onTaskClick?.(task);
  };

  const content = (
    <div className={cn('relative flex items-start space-x-4 pb-6 group', className)}>
      {/* Timeline Line */}
      {!isLast && (
        <div className={cn(
          'absolute left-2 top-6 w-0.5 h-full',
          styles.line
        )} />
      )}

      {/* Status Ring */}
      <div className="relative z-10 flex-shrink-0 mt-1">
        <StatusRing
          status={task.status}
          animated={animated}
          size="md"
        />
      </div>

      {/* Event Content */}
      <div 
        className={cn(
          'flex-1 min-w-0 transition-all duration-200 relative',
          styles.container,
          onTaskClick && 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2'
        )}
        onClick={handleClick}
      >
        {/* Actions Button */}
        {showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActionsMenu(!showActionsMenu);
            }}
            className={cn(
              'absolute top-0 right-0 p-1 rounded-md opacity-0 group-hover:opacity-100',
              'transition-opacity hover:bg-gray-200 focus:outline-none focus:opacity-100',
              'text-gray-400 hover:text-gray-600'
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
        {/* Time Range */}
        {showTimeRange && (
          <div className={cn('flex items-center space-x-2 mb-1', styles.time)}>
            <Clock className="w-3 h-3" />
            <span className="text-xs font-mono">
              {formatTimeRange(task.startTime, task.endTime)}
            </span>
            {showRelativeTime && (
              <>
                <span className="text-xs">•</span>
                <span className="text-xs">
                  {formatRelativeTime(task.updatedAt)}
                </span>
              </>
            )}
          </div>
        )}

        {/* Task Title */}
        <h3 className={cn('font-medium leading-tight mb-1', styles.title)}>
          {task.title}
        </h3>

        {/* Task Description */}
        {task.description && task.description !== task.title && (
          <p className={cn('text-sm leading-relaxed', styles.content)}>
            {task.description}
          </p>
        )}

        {/* Additional Info for Recently Completed */}
        {task.status === TimelineStatus.RECENTLY_COMPLETED && (
          <div className="flex items-center space-x-2 mt-2 text-xs text-green-600">
            <Calendar className="w-3 h-3" />
            <span>Just completed</span>
            {task.priority > 3 && (
              <>
                <span>•</span>
                <span className="font-medium">High priority</span>
              </>
            )}
          </div>
        )}

        {/* Priority Indicator for Upcoming Tasks */}
        {task.status === TimelineStatus.UPCOMING && task.priority >= 4 && (
          <div className="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
            High Priority
          </div>
        )}

        {/* Task Actions Menu */}
        <TaskActionsMenu
          task={task}
          isOpen={showActionsMenu}
          onClose={() => setShowActionsMenu(false)}
          onEdit={onTaskEdit}
          onDelete={onTaskDelete}
          className="top-6 right-0"
        />
      </div>
    </div>
  );

  if (animated) {
    return (
      <StaggerItem className={className}>
        {content}
      </StaggerItem>
    );
  }

  return content;
}