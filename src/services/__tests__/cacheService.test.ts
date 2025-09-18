import { CacheService } from '../cacheService';

// Mock storage service
jest.mock('../storageService', () => ({
  storageService: {
    getCache: jest.fn(),
    setCache: jest.fn(),
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    // Create a new instance for each test
    cacheService = new (CacheService as any)({ ttl: 1000, maxSize: 3 });
  });

  afterEach(() => {
    // Clear cache after each test
    cacheService.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get cache entries', async () => {
      const testData = { message: 'test' };
      await cacheService.set('test-key', testData);
      
      const retrieved = cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await cacheService.set('test-key', 'test-value');
      
      expect(cacheService.has('test-key')).toBe(true);
      expect(cacheService.has('non-existent')).toBe(false);
    });

    it('should delete cache entries', async () => {
      await cacheService.set('test-key', 'test-value');
      expect(cacheService.has('test-key')).toBe(true);
      
      await cacheService.delete('test-key');
      expect(cacheService.has('test-key')).toBe(false);
    });

    it('should clear all cache entries', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);
      
      await cacheService.clear();
      
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      await cacheService.set('test-key', 'test-value', 100); // 100ms TTL
      
      expect(cacheService.has('test-key')).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cacheService.has('test-key')).toBe(false);
      expect(cacheService.get('test-key')).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      await cacheService.set('test-key', 'test-value', 2000); // 2 seconds
      
      // Should still be valid after default TTL (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cacheService.has('test-key')).toBe(true);
    });
  });

  describe('Size Management', () => {
    it('should evict oldest entries when max size is reached', async () => {
      // Fill cache to max size (3)
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');
      
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);
      expect(cacheService.has('key3')).toBe(true);
      
      // Add one more to trigger eviction
      await cacheService.set('key4', 'value4');
      
      // Oldest entry (key1) should be evicted
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(true);
      expect(cacheService.has('key3')).toBe(true);
      expect(cacheService.has('key4')).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      await cacheService.set('valid-key', 'valid-value', 2000);
      await cacheService.set('expired-key', 'expired-value', 100);
      
      // Wait for one entry to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const removedCount = cacheService.cleanup();
      
      expect(removedCount).toBe(1);
      expect(cacheService.has('valid-key')).toBe(true);
      expect(cacheService.has('expired-key')).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should provide cache statistics', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', { data: 'complex' });
      
      const stats = cacheService.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty('key');
      expect(stats.entries[0]).toHaveProperty('size');
      expect(stats.entries[0]).toHaveProperty('age');
      expect(stats.entries[0]).toHaveProperty('ttl');
    });
  });

  describe('Task-specific Methods', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'A test task',
      startTime: new Date(),
      endTime: new Date(),
      status: 'upcoming' as const,
      priority: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should cache and retrieve tasks', async () => {
      await cacheService.cacheTask(mockTask);
      
      const retrieved = cacheService.getCachedTask('task-1');
      expect(retrieved).toEqual(mockTask);
    });

    it('should cache and retrieve task arrays', async () => {
      const tasks = [mockTask];
      await cacheService.cacheTasks(tasks);
      
      const retrieved = cacheService.getCachedTasks();
      expect(retrieved).toEqual(tasks);
    });
  });

  describe('LLM Response Caching', () => {
    it('should cache and retrieve LLM responses', async () => {
      const input = 'Create a task for tomorrow';
      const response = { tasks: [], success: true };
      
      await cacheService.cacheLLMResponse(input, response);
      
      const retrieved = cacheService.getCachedLLMResponse(input);
      expect(retrieved).toEqual(response);
    });

    it('should generate consistent hashes for same input', async () => {
      const input = 'Same input text';
      const response1 = { data: 'response1' };
      const response2 = { data: 'response2' };
      
      await cacheService.cacheLLMResponse(input, response1);
      const retrieved1 = cacheService.getCachedLLMResponse(input);
      
      await cacheService.cacheLLMResponse(input, response2);
      const retrieved2 = cacheService.getCachedLLMResponse(input);
      
      expect(retrieved1).toEqual(response1);
      expect(retrieved2).toEqual(response2);
    });
  });
});