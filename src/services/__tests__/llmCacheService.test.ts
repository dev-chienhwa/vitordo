import { LLMCacheService } from '../llmCacheService';
import { TimelineStatus } from '@/types/task';

// Mock cache service
jest.mock('../cacheService', () => ({
  cacheService: {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn(() => ({
      size: 0,
      entries: [],
    })),
  },
}));

describe('LLMCacheService', () => {
  let llmCacheService: LLMCacheService;
  const mockCacheService = require('../cacheService').cacheService;

  beforeEach(() => {
    llmCacheService = new (LLMCacheService as any)({
      ttl: 1000,
      maxEntries: 10,
      enableContextSensitive: true,
      similarityThreshold: 0.8,
    });
    jest.clearAllMocks();
  });

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'A test task',
    startTime: new Date(),
    endTime: new Date(),
    status: TimelineStatus.UPCOMING,
    priority: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResponse = {
    success: true,
    tasks: [mockTask],
    confidence: 0.9,
  };

  describe('Cache Operations', () => {
    it('should cache LLM responses', async () => {
      await llmCacheService.cacheResponse('test input', mockResponse, [mockTask], 'openai');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('llm_'),
        expect.objectContaining({
          input: 'test input',
          response: mockResponse,
          context: [mockTask],
          provider: 'openai',
        }),
        1000
      );
    });

    it('should retrieve cached responses', async () => {
      const mockCacheEntry = {
        input: 'test input',
        response: mockResponse,
        context: [mockTask],
        timestamp: Date.now(),
        hitCount: 0,
        provider: 'openai',
      };

      mockCacheService.get.mockReturnValue(mockCacheEntry);

      const result = await llmCacheService.getCachedResponse('test input', [mockTask]);

      expect(result).toEqual(mockResponse);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should return null for cache miss', async () => {
      mockCacheService.get.mockReturnValue(null);

      const result = await llmCacheService.getCachedResponse('non-existent input');

      expect(result).toBeNull();
    });

    it('should check if response is cached', () => {
      mockCacheService.has.mockReturnValue(true);

      const result = llmCacheService.hasCachedResponse('test input');

      expect(result).toBe(true);
      expect(mockCacheService.has).toHaveBeenCalled();
    });
  });

  describe('Context Sensitivity', () => {
    it('should generate different cache keys for different contexts', async () => {
      const context1 = [mockTask];
      const context2 = [{ ...mockTask, id: 'task-2' }];

      await llmCacheService.cacheResponse('same input', mockResponse, context1);
      await llmCacheService.cacheResponse('same input', mockResponse, context2);

      expect(mockCacheService.set).toHaveBeenCalledTimes(2);
      
      const calls = mockCacheService.set.mock.calls;
      expect(calls[0][0]).not.toEqual(calls[1][0]); // Different cache keys
    });

    it('should generate same cache key for same context', async () => {
      await llmCacheService.cacheResponse('test input', mockResponse, [mockTask]);
      await llmCacheService.cacheResponse('test input', mockResponse, [mockTask]);

      expect(mockCacheService.set).toHaveBeenCalledTimes(2);
      
      const calls = mockCacheService.set.mock.calls;
      expect(calls[0][0]).toEqual(calls[1][0]); // Same cache keys
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', () => {
      mockCacheService.getStats.mockReturnValue({
        size: 5,
        entries: [
          { key: 'key1', size: 100 },
          { key: 'key2', size: 200 },
        ],
      });

      const stats = llmCacheService.getCacheStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('totalMisses');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should track hit counts', async () => {
      const mockCacheEntry = {
        input: 'test input',
        response: mockResponse,
        context: [],
        timestamp: Date.now(),
        hitCount: 0,
        provider: 'openai',
      };

      mockCacheService.get.mockReturnValue(mockCacheEntry);

      // First hit
      await llmCacheService.getCachedResponse('test input');
      
      // Second hit
      await llmCacheService.getCachedResponse('test input');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ hitCount: 1 }),
        expect.any(Number)
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all cache when no pattern provided', async () => {
      await llmCacheService.invalidateCache();

      expect(mockCacheService.clear).toHaveBeenCalled();
    });

    it('should invalidate cache entries matching pattern', async () => {
      mockCacheService.getStats.mockReturnValue({
        size: 3,
        entries: [
          { key: 'vitordo_cache_llm_test1' },
          { key: 'vitordo_cache_llm_test2' },
          { key: 'vitordo_cache_other' },
        ],
      });

      await llmCacheService.invalidateCache('test');

      expect(mockCacheService.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Optimization', () => {
    it('should not optimize when under max entries', async () => {
      mockCacheService.getStats.mockReturnValue({ size: 5 });

      const removedCount = await llmCacheService.optimizeCache();

      expect(removedCount).toBe(0);
      expect(mockCacheService.delete).not.toHaveBeenCalled();
    });

    it('should remove least used entries when over max', async () => {
      mockCacheService.getStats.mockReturnValue({ size: 15 });

      // Mock hit stats
      (llmCacheService as any).hitStats = new Map([
        ['key1', 1],
        ['key2', 5],
        ['key3', 2],
        ['key4', 0],
        ['key5', 3],
      ]);

      const removedCount = await llmCacheService.optimizeCache();

      expect(removedCount).toBeGreaterThan(0);
      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });

  describe('Similarity Matching', () => {
    it('should find similar entries when fuzzy matching is enabled', async () => {
      const similarInput = 'create task for tomorrow';
      const cachedInput = 'create a task for tomorrow';

      const mockCacheEntry = {
        input: cachedInput,
        response: mockResponse,
        context: [],
        timestamp: Date.now(),
        hitCount: 0,
        provider: 'openai',
      };

      mockCacheService.get.mockReturnValue(null).mockReturnValueOnce(null);
      mockCacheService.getStats.mockReturnValue({
        size: 1,
        entries: [{ key: 'vitordo_cache_llm_test' }],
      });
      mockCacheService.get.mockReturnValueOnce(mockCacheEntry);

      const result = await llmCacheService.getCachedResponse(similarInput, [], true);

      expect(result).toEqual(mockResponse);
    });

    it('should not find dissimilar entries', async () => {
      const input = 'completely different input';
      const cachedInput = 'create a task for tomorrow';

      const mockCacheEntry = {
        input: cachedInput,
        response: mockResponse,
        context: [],
        timestamp: Date.now(),
        hitCount: 0,
        provider: 'openai',
      };

      mockCacheService.get.mockReturnValue(null);
      mockCacheService.getStats.mockReturnValue({
        size: 1,
        entries: [{ key: 'vitordo_cache_llm_test' }],
      });
      mockCacheService.get.mockReturnValueOnce(mockCacheEntry);

      const result = await llmCacheService.getCachedResponse(input, [], true);

      expect(result).toBeNull();
    });
  });
});