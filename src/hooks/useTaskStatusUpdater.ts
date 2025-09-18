import { useState, useCallback } from 'react';
import { Task, TimelineStatus } from '@/types/task';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { taskService } from '@/services/taskService';
import { ErrorHandler } from '@/utils/error-handler';

export interface TaskStatusUpdateResult {
  success: boolean;
  updatedTasks?: Task[];
  error?: string;
}

export function useTaskStatusUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateTaskStatus, updateTask } = useTaskStore();
  const { addNotification } = useUIStore();

  // Update single task status
  const updateSingleTaskStatus = useCallback(async (
    taskId: string,
    newStatus: TimelineStatus,
    reason?: string
  ): Promise<TaskStatusUpdateResult> => {
    setIsUpdating(true);
    
    try {
      const task = useTaskStore.getState().getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const oldStatus = task.status;
      
      // Update task in store
      updateTaskStatus(taskId, newStatus);
      
      // Update metadata
      const updatedTask = {
        ...task,
        status: newStatus,
        updatedAt: new Date(),
        metadata: {
          ...task.metadata,
          lastStatusChange: {
            from: oldStatus,
            to: newStatus,
            reason: reason || `Status changed from ${oldStatus} to ${newStatus}`,
            timestamp: new Date(),
          },
        },
      };

      updateTask(taskId, updatedTask);

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Task Updated',
        message: `"${task.title}" marked as ${newStatus.replace('_', ' ')}`,
        duration: 3000,
      });

      return {
        success: true,
        updatedTasks: [updatedTask],
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handleLLMError(error);
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  }, [updateTaskStatus, updateTask, addNotification]);

  // Update task status via natural language input
  const updateTaskStatusViaInput = useCallback(async (
    input: string
  ): Promise<TaskStatusUpdateResult> => {
    setIsUpdating(true);
    
    try {
      const result = await taskService.updateTaskStatus(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update task status');
      }

      return {
        success: true,
        updatedTasks: result.updatedTasks,
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handleLLMError(error);
      
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        message: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  }, [addNotification]);

  // Batch update multiple tasks
  const batchUpdateTaskStatus = useCallback(async (
    updates: Array<{ taskId: string; status: TimelineStatus; reason?: string }>
  ): Promise<TaskStatusUpdateResult> => {
    setIsUpdating(true);
    
    try {
      const updatedTasks: Task[] = [];
      
      for (const update of updates) {
        const task = useTaskStore.getState().getTaskById(update.taskId);
        if (!task) continue;

        const oldStatus = task.status;
        
        // Update task in store
        updateTaskStatus(update.taskId, update.status);
        
        // Update metadata
        const updatedTask = {
          ...task,
          status: update.status,
          updatedAt: new Date(),
          metadata: {
            ...task.metadata,
            lastStatusChange: {
              from: oldStatus,
              to: update.status,
              reason: update.reason || `Batch update: ${oldStatus} to ${update.status}`,
              timestamp: new Date(),
            },
          },
        };

        updateTask(update.taskId, updatedTask);
        updatedTasks.push(updatedTask);
      }

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Tasks Updated',
        message: `${updatedTasks.length} task(s) updated successfully`,
        duration: 3000,
      });

      return {
        success: true,
        updatedTasks,
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handleLLMError(error);
      
      addNotification({
        type: 'error',
        title: 'Batch Update Failed',
        message: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  }, [updateTaskStatus, updateTask, addNotification]);

  // Mark task as completed
  const markTaskCompleted = useCallback(async (
    taskId: string,
    reason?: string
  ): Promise<TaskStatusUpdateResult> => {
    return updateSingleTaskStatus(taskId, TimelineStatus.RECENTLY_COMPLETED, reason);
  }, [updateSingleTaskStatus]);

  // Mark task as upcoming (reset)
  const markTaskUpcoming = useCallback(async (
    taskId: string,
    reason?: string
  ): Promise<TaskStatusUpdateResult> => {
    return updateSingleTaskStatus(taskId, TimelineStatus.UPCOMING, reason);
  }, [updateSingleTaskStatus]);

  // Archive completed task (move to completed status)
  const archiveTask = useCallback(async (
    taskId: string,
    reason?: string
  ): Promise<TaskStatusUpdateResult> => {
    return updateSingleTaskStatus(taskId, TimelineStatus.COMPLETED, reason);
  }, [updateSingleTaskStatus]);

  // Auto-transition recently completed tasks to completed
  const autoTransitionTasks = useCallback(async (): Promise<TaskStatusUpdateResult> => {
    const tasks = useTaskStore.getState().tasks;
    const recentlyCompletedTasks = tasks.filter(
      task => task.status === TimelineStatus.RECENTLY_COMPLETED
    );

    // Find tasks that were completed more than 24 hours ago
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const tasksToArchive = recentlyCompletedTasks.filter(
      task => task.updatedAt < oneDayAgo
    );

    if (tasksToArchive.length === 0) {
      return { success: true, updatedTasks: [] };
    }

    const updates = tasksToArchive.map(task => ({
      taskId: task.id,
      status: TimelineStatus.COMPLETED,
      reason: 'Auto-archived after 24 hours',
    }));

    return batchUpdateTaskStatus(updates);
  }, [batchUpdateTaskStatus]);

  return {
    isUpdating,
    updateSingleTaskStatus,
    updateTaskStatusViaInput,
    batchUpdateTaskStatus,
    markTaskCompleted,
    markTaskUpcoming,
    archiveTask,
    autoTransitionTasks,
  };
}