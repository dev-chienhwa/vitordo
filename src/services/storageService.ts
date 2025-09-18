import { Task, TimelineEvent, TimelineStatus } from '@/types/task';
import { db, initializeDatabase, checkDatabaseHealth } from './database/config';
import { ErrorHandler } from '@/utils/error-handler';

export interface StorageStats {
  tasksCount: number;
  eventsCount: number;
  storageUsed: number;
  isHealthy: boolean;
}

export interface BackupData {
  tasks: Task[];
  timelineEvents: TimelineEvent[];
  settings: Record<string, any>;
  exportedAt: Date;
  version: string;
}

export class StorageService {
  private static instance: StorageService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize the storage service
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      const success = await initializeDatabase();
      this.isInitialized = success;
      return success;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.initialize');
      return false;
    }
  }

  // Task operations
  public async saveTasks(tasks: Task[]): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.transaction('rw', db.tasks, async () => {
        for (const task of tasks) {
          await db.tasks.put(task);
        }
      });
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  public async saveTask(task: Task): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.tasks.put(task);
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  public async loadTasks(): Promise<Task[]> {
    await this.ensureInitialized();
    
    try {
      return await db.tasks.orderBy('startTime').toArray();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.loadTasks');
      return [];
    }
  }

  public async getTaskById(id: string): Promise<Task | undefined> {
    await this.ensureInitialized();
    
    try {
      return await db.tasks.get(id);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getTaskById');
      return undefined;
    }
  }

  public async getTasksByStatus(status: TimelineStatus): Promise<Task[]> {
    await this.ensureInitialized();
    
    try {
      return await db.tasks.where('status').equals(status).toArray();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getTasksByStatus');
      return [];
    }
  }

  public async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    await this.ensureInitialized();
    
    try {
      return await db.tasks
        .where('startTime')
        .between(startDate, endDate, true, true)
        .toArray();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getTasksByDateRange');
      return [];
    }
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.tasks.update(id, updates);
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  public async deleteTask(id: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.transaction('rw', [db.tasks, db.timelineEvents], async () => {
        await db.tasks.delete(id);
        await db.timelineEvents.where('taskId').equals(id).delete();
      });
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  public async clearAllTasks(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.transaction('rw', [db.tasks, db.timelineEvents], async () => {
        await db.tasks.clear();
        await db.timelineEvents.clear();
      });
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  // Timeline event operations
  public async saveTimelineEvent(event: TimelineEvent): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.timelineEvents.put(event);
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  public async getTimelineEvents(taskId?: string): Promise<TimelineEvent[]> {
    await this.ensureInitialized();
    
    try {
      if (taskId) {
        return await db.timelineEvents
          .where('taskId')
          .equals(taskId)
          .orderBy('timestamp')
          .toArray();
      }
      return await db.timelineEvents.orderBy('timestamp').toArray();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getTimelineEvents');
      return [];
    }
  }

  // Settings operations
  public async saveSetting(key: string, value: any): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.settings.put({ key, value });
    } catch (error) {
      const errorMessage = ErrorHandler.handleStorageError(error);
      throw new Error(errorMessage);
    }
  }

  public async getSetting(key: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const setting = await db.settings.get(key);
      return setting?.value;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getSetting');
      return undefined;
    }
  }

  public async getAllSettings(): Promise<Record<string, any>> {
    await this.ensureInitialized();
    
    try {
      const settings = await db.settings.toArray();
      return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getAllSettings');
      return {};
    }
  }

  // Cache operations
  public async setCache(key: string, value: any, ttlMinutes = 60): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
      
      await db.cache.put({ key, value, expiresAt });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.setCache');
    }
  }

  public async getCache(key: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const cached = await db.cache.get(key);
      
      if (!cached) {
        return undefined;
      }
      
      if (cached.expiresAt < new Date()) {
        await db.cache.delete(key);
        return undefined;
      }
      
      return cached.value;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.getCache');
      return undefined;
    }
  }

  public async clearCache(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.cache.clear();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.clearCache');
    }
  }

  // Storage statistics and health
  public async getStorageStats(): Promise<StorageStats> {
    await this.ensureInitialized();
    
    const health = await checkDatabaseHealth();
    
    return {
      tasksCount: health.stats.tasksCount,
      eventsCount: health.stats.eventsCount,
      storageUsed: health.stats.storageUsed,
      isHealthy: health.isHealthy,
    };
  }

  // Data backup and restore
  public async exportData(): Promise<BackupData> {
    await this.ensureInitialized();
    
    try {
      const [tasks, timelineEvents, settings] = await Promise.all([
        db.tasks.toArray(),
        db.timelineEvents.toArray(),
        this.getAllSettings(),
      ]);

      return {
        tasks,
        timelineEvents,
        settings,
        exportedAt: new Date(),
        version: '1.0.0',
      };
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.exportData');
      throw new Error('Failed to export data');
    }
  }

  public async importData(backupData: BackupData): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await db.transaction('rw', [db.tasks, db.timelineEvents, db.settings], async () => {
        // Clear existing data
        await db.tasks.clear();
        await db.timelineEvents.clear();
        await db.settings.clear();
        
        // Import new data
        if (backupData.tasks.length > 0) {
          await db.tasks.bulkAdd(backupData.tasks);
        }
        
        if (backupData.timelineEvents.length > 0) {
          await db.timelineEvents.bulkAdd(backupData.timelineEvents);
        }
        
        // Import settings
        const settingsArray = Object.entries(backupData.settings).map(([key, value]) => ({
          key,
          value,
        }));
        
        if (settingsArray.length > 0) {
          await db.settings.bulkAdd(settingsArray);
        }
      });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.importData');
      throw new Error('Failed to import data');
    }
  }

  // Utility methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Storage service is not available');
      }
    }
  }

  public async close(): Promise<void> {
    try {
      await db.close();
      this.isInitialized = false;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'StorageService.close');
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();