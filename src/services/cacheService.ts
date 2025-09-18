import { storageService } from './storageService';
import { Task } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  prefix?: string; // Key prefix for namespacing
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;

  private constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      prefix: 'vitordo_cache',
      ...options,
    };

    // Load cache from storage on initialization
    this.loadFromStorage();
  }

  public static getInstance(options?: CacheOptions): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(options);
    }
    return CacheService.instance;
  }

  // Set cache entry
  public async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const fullKey = `${this.options.prefix}_${key}`;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.options.ttl,
        key: fullKey,
      };

      // Remove oldest entries if cache is full
      if (this.cache.size >= this.options.maxSize) {
        this.evictOldest();
      }

      this.cache.set(fullKey, entry);
      
      // Persist to storage
      await this.saveToStorage();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CacheService.set');
    }
  }

  // Get cache entry
  public get<T>(key: string): T | null {
    try {
      const fullKey = `${this.options.prefix}_${key}`;
      const entry = this.cache.get(fullKey);

      if (!entry) {
        return null;
      }

      // Check if entry has expired
      if (this.isExpired(entry)) {
        this.cache.delete(fullKey);
        this.saveToStorage(); // Async, but don't wait
        return null;
      }

      return entry.data as T;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CacheService.get');
      return null;
    }
  }

  // Check if key exists and is not expired
  public has(key: string): boolean {
    const fullKey = `${this.options.prefix}_${key}`;
    const entry = this.cache.get(fullKey);
    return entry !== undefined && !this.isExpired(entry);
  }

  // Delete cache entry
  public async delete(key: string): Promise<void> {
    try {
      const fullKey = `${this.options.prefix}_${key}`;
      this.cache.delete(fullKey);
      await this.saveToStorage();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CacheService.delete');
    }
  }

  // Clear all cache entries
  public async clear(): Promise<void> {
    try {
      this.cache.clear();
      await this.saveToStorage();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CacheService.clear');
    }
  }

  // Get cache statistics
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; size: number; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.values()).map(entry => ({
      key: entry.key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
      entries,
    };
  }

  // Clean up expired entries
  public cleanup(): number {
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.saveToStorage(); // Async, but don't wait
    }

    return removedCount;
  }

  // Task-specific cache methods
  public async cacheTask(task: Task): Promise<void> {
    await this.set(`task_${task.id}`, task, 10 * 60 * 1000); // 10 minutes
  }

  public getCachedTask(taskId: string): Task | null {
    return this.get<Task>(`task_${taskId}`);
  }

  public async cacheTasks(tasks: Task[]): Promise<void> {
    await this.set('all_tasks', tasks, 5 * 60 * 1000); // 5 minutes
  }

  public getCachedTasks(): Task[] | null {
    return this.get<Task[]>('all_tasks');
  }

  // LLM response caching
  public async cacheLLMResponse(input: string, response: any): Promise<void> {
    const key = `llm_${this.hashString(input)}`;
    await this.set(key, response, 30 * 60 * 1000); // 30 minutes
  }

  public getCachedLLMResponse(input: string): any | null {
    const key = `llm_${this.hashString(input)}`;
    return this.get(key);
  }

  // Private methods
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const cacheData = await storageService.getCache('cache_entries');
      if (cacheData && Array.isArray(cacheData)) {
        for (const entry of cacheData) {
          if (!this.isExpired(entry)) {
            this.cache.set(entry.key, entry);
          }
        }
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CacheService.loadFromStorage');
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const cacheData = Array.from(this.cache.values());
      await storageService.setCache('cache_entries', cacheData, 24 * 60); // 24 hours
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CacheService.saveToStorage');
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Hook for using cache in components
export function useCache() {
  const cache = CacheService.getInstance();

  const getCached = <T>(key: string): T | null => {
    return cache.get<T>(key);
  };

  const setCached = async <T>(key: string, data: T, ttl?: number): Promise<void> => {
    await cache.set(key, data, ttl);
  };

  const deleteCached = async (key: string): Promise<void> => {
    await cache.delete(key);
  };

  const clearCache = async (): Promise<void> => {
    await cache.clear();
  };

  return {
    getCached,
    setCached,
    deleteCached,
    clearCache,
    has: cache.has.bind(cache),
    cleanup: cache.cleanup.bind(cache),
    getStats: cache.getStats.bind(cache),
  };
}