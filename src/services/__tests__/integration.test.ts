import { taskService } from '../taskService';
import { LLMService } from '../llmService';
import { storageService } from '../storageService';
import { llmCacheService } from '../llmCacheService';
import { createMockTask, mockLLMResponse } from '@/test-utils';
import { TimelineStatus } from '@/types/task';

// Mock external dependencies
jest.mock('../storageService');
jest.mock('../llmCacheService');

describe('Service Integration Tests', () => {
  const mockStorageService = storageService as jest.Mocked<typeof storageService>;
  const mockLLMCacheService = llmCacheService as jest.Mocked<typeof llmCacheService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockStorageService.saveTasks.mockResolvedValue();
    mockStorageService.saveTimelineEvent.mockResolvedValue();
    mockLLMCacheService.getCachedResponse.mockResolvedValue(null);
    mockLLMCacheService.cacheResponse.mockResolvedValue();
  });

  describe('Task Service Integration', () => {
    it('should process user input end-to-end', async () => {
      // Setup
      const mockTasks = [createMockTask()];
      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      // Mock LLM response
      jest.spyOn(llmService, 'parseTaskInput').mockResolvedValue({
        ...mockLLMResponse,
        tasks: mockTasks,
      });

      taskService.setLLMService(llmService);

      // Execute
      const result = await taskService.processUserInput('Create a task for tomorrow');

      // Verify
      expect(result.success).toBe(true);
      expect(result.tasks).toEqual(mockTasks);
      expect(mockStorageService.saveTasks).toHaveBeenCalledWith(mockTasks);
      expect(mockStorageService.saveTimelineEvent).toHaveBeenCalled();
    });

    it('should handle LLM service failures gracefully', async () => {
      // Setup
      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      jest.spyOn(llmService, 'parseTaskInput').mockResolvedValue({
        success: false,
        error: 'API rate limit exceeded',
      });

      taskService.setLLMService(llmService);

      // Execute
      const result = await taskService.processUserInput('Create a task');

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('API rate limit exceeded');
      expect(mockStorageService.saveTasks).not.toHaveBeenCalled();
    });

    it('should update task status with LLM integration', async () => {
      // Setup
      const mockTasks = [
        createMockTask({ id: 'task-1', status: TimelineStatus.UPCOMING }),
        createMockTask({ id: 'task-2', status: TimelineStatus.RECENTLY_COMPLETED }),
      ];

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      jest.spyOn(llmService, 'updateTaskStatus').mockResolvedValue({
        success: true,
        statusUpdates: [
          {
            taskId: 'task-1',
            newStatus: TimelineStatus.RECENTLY_COMPLETED,
            reason: 'Task completed',
            timestamp: new Date(),
          },
        ],
      });

      taskService.setLLMService(llmService);

      // Mock task store
      const mockTaskStore = {
        tasks: mockTasks,
        getTaskById: jest.fn((id) => mockTasks.find(t => t.id === id)),
        updateTask: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
      };

      jest.doMock('@/stores/taskStore', () => ({
        useTaskStore: {
          getState: () => mockTaskStore,
        },
      }));

      // Execute
      const result = await taskService.updateTaskStatus('I finished task 1');

      // Verify
      expect(result.success).toBe(true);
      expect(result.updatedTasks).toHaveLength(1);
      expect(result.statusUpdates).toHaveLength(1);
    });
  });

  describe('LLM Cache Integration', () => {
    it('should use cached responses when available', async () => {
      // Setup
      const cachedResponse = mockLLMResponse;
      mockLLMCacheService.getCachedResponse.mockResolvedValue(cachedResponse);

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
        cacheEnabled: true,
      });

      const parseTaskInputSpy = jest.spyOn(llmService as any, 'tryProvider');

      // Execute
      const result = await llmService.parseTaskInput('Create a task');

      // Verify
      expect(result).toEqual(cachedResponse);
      expect(mockLLMCacheService.getCachedResponse).toHaveBeenCalledWith('Create a task', undefined);
      expect(parseTaskInputSpy).not.toHaveBeenCalled(); // Should not call actual LLM
    });

    it('should cache new responses', async () => {
      // Setup
      mockLLMCacheService.getCachedResponse.mockResolvedValue(null); // No cache hit

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
        cacheEnabled: true,
      });

      // Mock successful LLM response
      jest.spyOn(llmService as any, 'tryProvider').mockResolvedValue(mockLLMResponse);

      // Execute
      const result = await llmService.parseTaskInput('Create a task');

      // Verify
      expect(result).toEqual(mockLLMResponse);
      expect(mockLLMCacheService.cacheResponse).toHaveBeenCalledWith(
        'Create a task',
        mockLLMResponse,
        undefined,
        expect.any(String)
      );
    });
  });

  describe('Storage Integration', () => {
    it('should persist tasks and timeline events', async () => {
      // Setup
      const mockTasks = [createMockTask()];
      mockStorageService.saveTasks.mockResolvedValue();
      mockStorageService.saveTimelineEvent.mockResolvedValue();

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      jest.spyOn(llmService, 'parseTaskInput').mockResolvedValue({
        ...mockLLMResponse,
        tasks: mockTasks,
      });

      taskService.setLLMService(llmService);

      // Execute
      await taskService.processUserInput('Create a task');

      // Verify storage calls
      expect(mockStorageService.saveTasks).toHaveBeenCalledWith(mockTasks);
      expect(mockStorageService.saveTimelineEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: mockTasks[0].id,
          status: mockTasks[0].status,
          content: expect.stringContaining('created'),
        })
      );
    });

    it('should handle storage failures gracefully', async () => {
      // Setup
      const mockTasks = [createMockTask()];
      mockStorageService.saveTasks.mockRejectedValue(new Error('Storage full'));

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      jest.spyOn(llmService, 'parseTaskInput').mockResolvedValue({
        ...mockLLMResponse,
        tasks: mockTasks,
      });

      taskService.setLLMService(llmService);

      // Execute
      const result = await taskService.processUserInput('Create a task');

      // Verify - should still succeed even if storage fails
      expect(result.success).toBe(true);
      expect(result.tasks).toEqual(mockTasks);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors across services', async () => {
      // Setup network error
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      jest.spyOn(llmService, 'parseTaskInput').mockRejectedValue(networkError);
      taskService.setLLMService(llmService);

      // Execute
      const result = await taskService.processUserInput('Create a task');

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle validation errors', async () => {
      // Execute with invalid input
      const result = await taskService.processUserInput('');

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toContain('Input cannot be empty');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Setup
      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
      });

      jest.spyOn(llmService, 'parseTaskInput').mockImplementation(async (input) => ({
        ...mockLLMResponse,
        tasks: [createMockTask({ title: input })],
      }));

      taskService.setLLMService(llmService);

      // Execute multiple concurrent requests
      const requests = [
        taskService.processUserInput('Task 1'),
        taskService.processUserInput('Task 2'),
        taskService.processUserInput('Task 3'),
      ];

      const results = await Promise.all(requests);

      // Verify all requests succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.tasks?.[0].title).toBe(`Task ${index + 1}`);
      });
    });

    it('should cache responses for similar inputs', async () => {
      // Setup
      mockLLMCacheService.getCachedResponse
        .mockResolvedValueOnce(null) // First call - cache miss
        .mockResolvedValueOnce(mockLLMResponse); // Second call - cache hit

      const llmService = new LLMService({
        provider: {
          name: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
        },
        cacheEnabled: true,
      });

      const tryProviderSpy = jest.spyOn(llmService as any, 'tryProvider')
        .mockResolvedValue(mockLLMResponse);

      // Execute same input twice
      await llmService.parseTaskInput('Create a task');
      await llmService.parseTaskInput('Create a task');

      // Verify cache behavior
      expect(mockLLMCacheService.getCachedResponse).toHaveBeenCalledTimes(2);
      expect(tryProviderSpy).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });
});