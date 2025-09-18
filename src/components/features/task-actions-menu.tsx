'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Task, TimelineStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useTaskStatusUpdater } from '@/hooks/useTaskStatusUpdater';
import { 
  CheckCircle, 
  Clock, 
  Archive, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  X
} from 'lucide-react';

export interface TaskActionsMenuProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  className?: string;
}

export function TaskActionsMenu({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  className,
}: TaskActionsMenuProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    markTaskCompleted,
    markTaskUpcoming,
    archiveTask,
    isUpdating,
  } = useTaskStatusUpdater();

  const handleStatusChange = async (newStatus: TimelineStatus, reason: string) => {
    setIsProcessing(true);
    
    try {
      switch (newStatus) {
        case TimelineStatus.RECENTLY_COMPLETED:
          await markTaskCompleted(task.id, reason);
          break;
        case TimelineStatus.UPCOMING:
          await markTaskUpcoming(task.id, reason);
          break;
        case TimelineStatus.COMPLETED:
          await archiveTask(task.id, reason);
          break;
      }
      onClose();
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (task.status) {
      case TimelineStatus.UPCOMING:
        actions.push({
          id: 'complete',
          label: 'Mark as Completed',
          icon: CheckCircle,
          color: 'text-green-600 hover:text-green-700',
          action: () => handleStatusChange(TimelineStatus.RECENTLY_COMPLETED, 'Manually marked as completed'),
        });
        break;
        
      case TimelineStatus.RECENTLY_COMPLETED:
        actions.push(
          {
            id: 'archive',
            label: 'Archive Task',
            icon: Archive,
            color: 'text-gray-600 hover:text-gray-700',
            action: () => handleStatusChange(TimelineStatus.COMPLETED, 'Manually archived'),
          },
          {
            id: 'reopen',
            label: 'Mark as Upcoming',
            icon: Clock,
            color: 'text-blue-600 hover:text-blue-700',
            action: () => handleStatusChange(TimelineStatus.UPCOMING, 'Reopened task'),
          }
        );
        break;
        
      case TimelineStatus.COMPLETED:
        actions.push({
          id: 'reopen',
          label: 'Reopen Task',
          icon: Clock,
          color: 'text-blue-600 hover:text-blue-700',
          action: () => handleStatusChange(TimelineStatus.UPCOMING, 'Reopened archived task'),
        });
        break;
    }

    // Common actions
    if (onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit Task',
        icon: Edit,
        color: 'text-gray-600 hover:text-gray-700',
        action: () => {
          onEdit(task);
          onClose();
        },
      });
    }

    if (onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete Task',
        icon: Trash2,
        color: 'text-red-600 hover:text-red-700',
        action: () => {
          onDelete(task);
          onClose();
        },
      });
    }

    return actions;
  };

  if (!isOpen) return null;

  const actions = getAvailableActions();

  return (
    <AnimatedContainer direction="down" duration={0.2}>
      <Card className={cn('absolute top-full right-0 mt-2 z-50 min-w-48', className)}>
        <CardContent className="p-2">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-100 mb-2">
            <div className="flex items-center space-x-2">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Task Actions</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            {actions.map((action) => {
              const Icon = action.icon;
              
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={isProcessing || isUpdating}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 text-left',
                    'rounded-md transition-colors text-sm',
                    'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    action.color
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{action.label}</span>
                  {(isProcessing || isUpdating) && (
                    <div className="ml-auto">
                      <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Task Info */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="truncate">
                <span className="font-medium">Task:</span> {task.title}
              </div>
              <div>
                <span className="font-medium">Status:</span> {task.status.replace('_', ' ')}
              </div>
              <div>
                <span className="font-medium">Priority:</span> {task.priority}/5
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}