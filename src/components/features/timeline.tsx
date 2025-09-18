'use client';

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Task, TimelineStatus } from '@/types/task';
import { TimelineEvent } from './timeline-event';
import { StaggerContainer } from '@/components/ui/animated-container';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

export interface TimelineProps {
  tasks: Task[];
  className?: string;
  animated?: boolean;
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  groupByStatus?: boolean;
  showEmptyState?: boolean;
}

interface TaskGroup {
  status: TimelineStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tasks: Task[];
  color: string;
}

export function Timeline({
  tasks,
  className,
  animated = true,
  isLoading = false,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  groupByStatus = true,
  showEmptyState = true,
}: TimelineProps) {
  // Group and sort tasks
  const taskGroups = useMemo(() => {
    if (!groupByStatus) {
      // Sort all tasks by time
      const sortedTasks = [...tasks].sort((a, b) => 
        a.startTime.getTime() - b.startTime.getTime()
      );
      return [{
        status: TimelineStatus.UPCOMING,
        title: 'All Tasks',
        icon: Calendar,
        tasks: sortedTasks,
        color: 'text-gray-600',
      }];
    }

    // Group by status
    const groups: TaskGroup[] = [
      {
        status: TimelineStatus.RECENTLY_COMPLETED,
        title: 'Recently Completed',
        icon: CheckCircle,
        tasks: tasks.filter(task => task.status === TimelineStatus.RECENTLY_COMPLETED),
        color: 'text-green-600',
      },
      {
        status: TimelineStatus.UPCOMING,
        title: 'Upcoming',
        icon: Clock,
        tasks: tasks.filter(task => task.status === TimelineStatus.UPCOMING),
        color: 'text-blue-600',
      },
      {
        status: TimelineStatus.COMPLETED,
        title: 'Completed',
        icon: CheckCircle,
        tasks: tasks.filter(task => task.status === TimelineStatus.COMPLETED),
        color: 'text-gray-500',
      },
    ];

    // Sort tasks within each group by time
    groups.forEach(group => {
      group.tasks.sort((a, b) => {
        if (group.status === TimelineStatus.COMPLETED) {
          // For completed tasks, show most recent first
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        }
        // For others, show by start time
        return a.startTime.getTime() - b.startTime.getTime();
      });
    });

    // Filter out empty groups
    return groups.filter(group => group.tasks.length > 0);
  }, [tasks, groupByStatus]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0 && showEmptyState) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-500">
              Start by describing what you need to do in the input box. 
              I&apos;ll help you break it down and schedule it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const TimelineContainer = animated ? StaggerContainer : 'div';

  return (
    <div className={cn('space-y-8', className)}>
      <TimelineContainer staggerDelay={0.1}>
        {taskGroups.map((group, groupIndex) => (
          <div key={group.status} className="space-y-4">
            {/* Group Header */}
            {groupByStatus && (
              <div className="flex items-center space-x-2 px-6">
                <group.icon className={cn('w-5 h-5', group.color)} />
                <h3 className={cn('font-semibold', group.color)}>
                  {group.title}
                </h3>
                <span className={cn('text-sm', group.color)}>
                  ({group.tasks.length})
                </span>
              </div>
            )}

            {/* Tasks */}
            <div className="px-6 space-y-0">
              {group.tasks.map((task, taskIndex) => (
                <TimelineEvent
                  key={task.id}
                  task={task}
                  index={groupIndex * 100 + taskIndex}
                  animated={animated}
                  onTaskClick={onTaskClick}
                  onTaskEdit={onTaskEdit}
                  onTaskDelete={onTaskDelete}
                  isLast={taskIndex === group.tasks.length - 1 && groupIndex === taskGroups.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </TimelineContainer>
    </div>
  );
}