import Dexie, { Table } from 'dexie';
import { Task, TimelineEvent } from '@/types/task';

// Database schema version
export const DB_VERSION = 1;
export const DB_NAME = 'VitordoDB';

// Database interface
export interface VitordoDatabase extends Dexie {
  tasks: Table<Task>;
  timelineEvents: Table<TimelineEvent>;
  settings: Table<{ key: string; value: any }>;
  cache: Table<{ key: string; value: any; expiresAt: Date }>;
}

// Database instance
export class VitordoDB extends Dexie implements VitordoDatabase {
  tasks!: Table<Task>;
  timelineEvents!: Table<TimelineEvent>;
  settings!: Table<{ key: string; value: any }>;
  cache!: Table<{ key: string; value: any; expiresAt: Date }>;

  constructor() {
    super(DB_NAME);
    
    this.version(DB_VERSION).stores({
      tasks: 'id, title, status, startTime, endTime, priority, createdAt, updatedAt',
      timelineEvents: 'id, taskId, timestamp, status',
      settings: 'key',
      cache: 'key, expiresAt',
    });

    // Hooks for data transformation
    this.tasks.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.tasks.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    // Auto-cleanup expired cache entries
    this.cache.hook('ready', () => {
      this.cleanupExpiredCache();
    });
  }

  private async cleanupExpiredCache() {
    const now = new Date();
    await this.cache.where('expiresAt').below(now).delete();
  }
}

// Singleton database instance
export const db = new VitordoDB();

// Database initialization and error handling
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    await db.open();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. Attempting to clear old data...');
      try {
        await clearOldData();
        await db.open();
        return true;
      } catch (clearError) {
        console.error('Failed to clear old data:', clearError);
      }
    }
    
    return false;
  }
};

// Clear old data to free up space
const clearOldData = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Clear old completed tasks
  await db.tasks
    .where('status')
    .equals('completed')
    .and(task => task.updatedAt < thirtyDaysAgo)
    .delete();
  
  // Clear old timeline events
  await db.timelineEvents
    .where('timestamp')
    .below(thirtyDaysAgo)
    .delete();
  
  // Clear expired cache
  await db.cache.where('expiresAt').below(new Date()).delete();
};

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  isHealthy: boolean;
  stats: {
    tasksCount: number;
    eventsCount: number;
    cacheCount: number;
    storageUsed: number;
  };
}> => {
  try {
    const [tasksCount, eventsCount, cacheCount] = await Promise.all([
      db.tasks.count(),
      db.timelineEvents.count(),
      db.cache.count(),
    ]);

    // Estimate storage usage (rough calculation)
    const storageUsed = await estimateStorageUsage();

    return {
      isHealthy: true,
      stats: {
        tasksCount,
        eventsCount,
        cacheCount,
        storageUsed,
      },
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      isHealthy: false,
      stats: {
        tasksCount: 0,
        eventsCount: 0,
        cacheCount: 0,
        storageUsed: 0,
      },
    };
  }
};

// Estimate storage usage
const estimateStorageUsage = async (): Promise<number> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.warn('Failed to estimate storage usage:', error);
    }
  }
  return 0;
};