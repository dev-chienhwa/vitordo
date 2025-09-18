import { Task, TimelineStatus, TimelineEvent, TaskUpdate } from '@/types/task';
import { LLMService } from './llmService';
import { storageService } from './storageService';
import { ErrorHandler } from '@/utils/error-handler';
import { validateTaskInput, validateTask } from '@/utils/validation';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';

export interface TaskServiceConfig {
  autoSave?: boolean;
  validateInput?: boolean;
  enableNotifications?: boolean;
}

export interface ProcessInputResult {
  success: boolean;
  tasks?: Task[];
  error?: string;
  confidence?: number;
}

export interface UpdateStatusResult {
  success: boolean;
  updatedTasks?: Task[];
  statusUpdates?: TaskUpdate[];
  error?: string;
}

export class TaskService {
  private static instance: TaskService;
  private llmService: LLMService | null = null;
  private config: TaskServiceConfig;

  private constructor(config: TaskServiceConfig = {}) {
    this.config = {
      autoSave: true,
      validateInput: true,
      enableNotifications: true,
      ...config,
    };
  }

  public static getInstance(config?: TaskServiceConfig): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService(config);
    }
    return TaskService.instance;
  }

  public setLLMService(llmService: LLMService): void {
    this.llmService = llmService;
  }

  public updateConfig(config: Partial<TaskServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Process user input and create tasks
  public async processUserInput(input: string): Promise<ProcessInputResult> {
    try {
      // Validate input
      if (this.config.validateInput) {
        const validation = validateTaskInput(input);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error,
          };
        }
      }

      // Check if LLM service is available
      if (!this.llmService) {
        return {
          success: false,
          error: 'LLM service is not configured',
        };
      }

      // Get current tasks for context
      const currentTasks = useTaskStore.getState().tasks;
      
      // Set loading state
      useTaskStore.getState().setLoading(true);
      useTaskStore.getState().setError(null);

      try {
        // Call LLM service to parse input
        const llmResponse = await this.llmService.parseTaskInput(input, currentTasks);

        if (!llmResponse.success) {
          throw new Error(llmResponse.error || 'Failed to parse input');
        }

        // Validate LLM response
        const validation = LLMService.validateTaskResponse(llmResponse);
        if (!validation.isValid) {
          throw new Error(`Invalid LLM response: ${validation.errors.join(', ')}`);
        }

        const tasks = validation.sanitizedTasks!;

        // Save tasks if auto-save is enabled
        if (this.config.autoSave) {
          await this.saveTasks(tasks);
        }

        // Update store
        useTaskStore.getState().addTasks(tasks);

        // Create timeline events
        await this.createTimelineEvents(tasks, 'created');

        // Show success notification
        if (this.config.enableNotifications) {
          useUIStore.getState().addNotification({
            type: 'success',
            title: 'Tasks Created',
            message: `Successfully created ${tasks.length} task(s)`,
          });
        }

        return {
          success: true,
          tasks,
          confidence: llmResponse.confidence,
        };
      } finally {
        useTaskStore.getState().setLoading(false);
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.processUserInput');
      
      const errorMessage = ErrorHandler.handleLLMError(error);
      useTaskStore.getState().setError(errorMessage);
      useTaskStore.getState().setLoading(false);

      if (this.config.enableNotifications) {
        useUIStore.getState().addNotification({
          type: 'error',
          title: 'Failed to Process Input',
          message: errorMessage,
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Update task status based on user input
  public async updateTaskStatus(input: string): Promise<UpdateStatusResult> {
    try {
      // Validate input
      if (this.config.validateInput) {
        const validation = validateTaskInput(input);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error,
          };
        }
      }

      // Check if LLM service is available
      if (!this.llmService) {
        return {
          success: false,
          error: 'LLM service is not configured',
        };
      }

      // Get current tasks
      const currentTasks = useTaskStore.getState().tasks;
      
      if (currentTasks.length === 0) {
        return {
          success: false,
          error: 'No tasks available to update',
        };
      }

      // Set loading state
      useTaskStore.getState().setLoading(true);
      useTaskStore.getState().setError(null);

      try {
        // Call LLM service to identify status updates
        const llmResponse = await this.llmService.updateTaskStatus(input, currentTasks);

        if (!llmResponse.success) {
          throw new Error(llmResponse.error || 'Failed to process status update');
        }

        if (!llmResponse.statusUpdates || llmResponse.statusUpdates.length === 0) {
          return {
            success: true,
            updatedTasks: [],
            statusUpdates: [],
          };
        }

        const updatedTasks: Task[] = [];
        const appliedUpdates: TaskUpdate[] = [];

        // Apply status updates
        for (const update of llmResponse.statusUpdates) {
          if (update.taskId) {
            // Update specific task
            const task = currentTasks.find(t => t.id === update.taskId);
            if (task) {
              const updatedTask = await this.updateSingleTaskStatus(task, update.newStatus, update.reason);
              updatedTasks.push(updatedTask);
              appliedUpdates.push(update);
            }
          } else {
            // Try to match tasks by content similarity
            const matchedTasks = await this.findTasksByContent(input, currentTasks);
            for (const task of matchedTasks) {
              const updatedTask = await this.updateSingleTaskStatus(task, update.newStatus, update.reason);
              updatedTasks.push(updatedTask);
              appliedUpdates.push({
                ...update,
                taskId: task.id,
              });
            }
          }
        }

        // Save updated tasks if auto-save is enabled
        if (this.config.autoSave && updatedTasks.length > 0) {
          await this.saveTasks(updatedTasks);
        }

        // Create timeline events for updates
        await this.createTimelineEvents(updatedTasks, 'updated');

        // Show success notification
        if (this.config.enableNotifications && updatedTasks.length > 0) {
          useUIStore.getState().addNotification({
            type: 'success',
            title: 'Tasks Updated',
            message: `Successfully updated ${updatedTasks.length} task(s)`,
          });
        }

        return {
          success: true,
          updatedTasks,
          statusUpdates: appliedUpdates,
        };
      } finally {
        useTaskStore.getState().setLoading(false);
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.updateTaskStatus');
      
      const errorMessage = ErrorHandler.handleLLMError(error);
      useTaskStore.getState().setError(errorMessage);
      useTaskStore.getState().setLoading(false);

      if (this.config.enableNotifications) {
        useUIStore.getState().addNotification({
          type: 'error',
          title: 'Failed to Update Tasks',
          message: errorMessage,
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Get tasks by status with sorting
  public getTasksByStatus(status: TimelineStatus, sortBy: 'time' | 'priority' | 'created' = 'time'): Task[] {
    const tasks = useTaskStore.getState().getTasksByStatus(status);
    
    return this.sortTasks(tasks, sortBy);
  }

  // Get tasks by date range
  public async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    try {
      return await storageService.getTasksByDateRange(startDate, endDate);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.getTasksByDateRange');
      return [];
    }
  }

  // Sort tasks by different criteria
  public sortTasks(tasks: Task[], sortBy: 'time' | 'priority' | 'created' = 'time'): Task[] {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return a.startTime.getTime() - b.startTime.getTime();
        case 'priority':
          return b.priority - a.priority; // Higher priority first
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newer first
        default:
          return 0;
      }
    });
  }

  // Validate task data
  public validateTaskData(task: Partial<Task>): { isValid: boolean; errors: string[] } {
    return validateTask(task);
  }

  // Get task statistics
  public getTaskStatistics(): {
    total: number;
    completed: number;
    recentlyCompleted: number;
    upcoming: number;
    overdue: number;
    completionRate: number;
  } {
    const tasks = useTaskStore.getState().tasks;
    const now = new Date();

    const stats = {
      total: tasks.length,
      completed: 0,
      recentlyCompleted: 0,
      upcoming: 0,
      overdue: 0,
      completionRate: 0,
    };

    for (const task of tasks) {
      switch (task.status) {
        case TimelineStatus.COMPLETED:
          stats.completed++;
          break;
        case TimelineStatus.RECENTLY_COMPLETED:
          stats.recentlyCompleted++;
          break;
        case TimelineStatus.UPCOMING:
          stats.upcoming++;
          if (task.endTime < now) {
            stats.overdue++;
          }
          break;
      }
    }

    const completedTotal = stats.completed + stats.recentlyCompleted;
    stats.completionRate = stats.total > 0 ? (completedTotal / stats.total) * 100 : 0;

    return stats;
  }

  // Private helper methods
  private async updateSingleTaskStatus(task: Task, newStatus: TimelineStatus, reason: string): Promise<Task> {
    const updatedTask: Task = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
      metadata: {
        ...task.metadata,
        lastStatusChange: {
          from: task.status,
          to: newStatus,
          reason,
          timestamp: new Date(),
        },
      },
    };

    // Update in store
    useTaskStore.getState().updateTask(task.id, updatedTask);

    return updatedTask;
  }

  private async findTasksByContent(input: string, tasks: Task[]): Promise<Task[]> {
    // Simple content matching - in a real app, you might use more sophisticated matching
    const inputLower = input.toLowerCase();
    const keywords = inputLower.split(/\s+/).filter(word => word.length > 2);

    return tasks.filter(task => {
      const taskText = `${task.title} ${task.description}`.toLowerCase();
      return keywords.some(keyword => taskText.includes(keyword));
    });
  }

  private async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await storageService.saveTasks(tasks);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.saveTasks');
      throw error;
    }
  }

  private async createTimelineEvents(tasks: Task[], eventType: 'created' | 'updated'): Promise<void> {
    try {
      for (const task of tasks) {
        const event: TimelineEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId: task.id,
          timestamp: new Date(),
          status: task.status,
          content: eventType === 'created' 
            ? `Task "${task.title}" was created`
            : `Task "${task.title}" status updated to ${task.status}`,
          timeRange: {
            start: task.startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            end: task.endTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          },
        };

        await storageService.saveTimelineEvent(event);
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.createTimelineEvents');
      // Don't throw - timeline events are not critical
    }
  }

  // Cleanup and maintenance methods
  public async cleanupOldTasks(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const tasks = useTaskStore.getState().tasks;
      const tasksToRemove = tasks.filter(
        task => task.status === TimelineStatus.COMPLETED && task.updatedAt < cutoffDate
      );

      for (const task of tasksToRemove) {
        await storageService.deleteTask(task.id);
        useTaskStore.getState().removeTask(task.id);
      }

      if (this.config.enableNotifications && tasksToRemove.length > 0) {
        useUIStore.getState().addNotification({
          type: 'info',
          title: 'Cleanup Complete',
          message: `Removed ${tasksToRemove.length} old completed tasks`,
        });
      }

      return tasksToRemove.length;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.cleanupOldTasks');
      return 0;
    }
  }

  public async exportTasks(): Promise<string> {
    try {
      const backupData = await storageService.exportData();
      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.exportTasks');
      throw new Error('Failed to export tasks');
    }
  }

  public async importTasks(jsonData: string): Promise<boolean> {
    try {
      const backupData = JSON.parse(jsonData);
      await storageService.importData(backupData);
      
      // Reload tasks in store
      const tasks = await storageService.loadTasks();
      useTaskStore.getState().setTasks(tasks);

      if (this.config.enableNotifications) {
        useUIStore.getState().addNotification({
          type: 'success',
          title: 'Import Complete',
          message: `Successfully imported ${tasks.length} tasks`,
        });
      }

      return true;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskService.importTasks');
      
      if (this.config.enableNotifications) {
        useUIStore.getState().addNotification({
          type: 'error',
          title: 'Import Failed',
          message: 'Failed to import tasks. Please check the file format.',
        });
      }

      return false;
    }
  }
}

// Export singleton instance
export const taskService = TaskService.getInstance();