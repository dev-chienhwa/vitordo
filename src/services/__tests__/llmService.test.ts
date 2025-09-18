import { LLMService } from '../llmService';
import { TimelineStatus } from '@/types/task';
import { LLMProvider as LLMProviderType } from '@/types/api';

// Mock the providers
jest.mock('../llm/providers/openai');
jest.mock('../llm/providers/anthropic');
jest.mock('../storageService');

const mockOpenAIProvider = {
  name: 'openai',
  model: 'gpt-3.5-turbo',
  isConfigured: jest.fn(() => true),
  parseTaskInput: jest.fn(),
  updateTaskStatus: jest.fn(),
  healthCheck: jest.fn(() => Promise.resolve(true)),
  configure: jest.fn(),
};

const mockAnthropicProvider = {
  name: 'anthropic',
  model: 'claude-3-haiku-20240307',
  isConfigured: jest.fn(() => true),
  parseTaskInput: jest.fn(),
  updateTaskStatus: jest.fn(),
  healthCheck: jest.fn(() => Promise.resolve(true)),
  configure: jest.fn(),
};

// Mock the provider classes
jest.mock('../llm/providers/openai', () => ({
  OpenAIProvider: jest.fn(() => mockOpenAIProvider),
}));

jest.mock('../llm/providers/anthropic', () => ({
  AnthropicProvider: jest.fn(() => mockAnthropicProvider),
}));

// Mock storage service
const mockStorageService = {
  getCache: jest.fn(),
  setCache: jest.fn(),
  clearCache: jest.fn(),
};

jest.mock('../storageService', () => ({
  storageService: mockStorageService,
}));

describe('LLMService', () => {
  let llmService: LLMService;
  
  const mockProviderConfig: LLMProviderType = {
    name: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    (LLMService as any).instance = null;
    
    llmService = LLMService.getInstance({
      provider: mockProviderConfig,
      cacheEnabled: true,
      cacheTTL: 60,
    });
  });

  describe('Initialization', () => {
    it('should initialize with config', () => {
      expect(llmService).toBeDefined();
      expect(llmService.getProviderInfo().primary.name).toBe('openai');
    });

    it('should throw error if initialized without config', () => {
      (LLMService as any).instance = null;
      expect(() => LLMService.getInstance()).toThrow();
    });
  });

  describe('Task Parsing', () => {
    it('should parse task input successfully', async () => {
      const mockResponse = {
        success: true,
        tasks: [
          {
            title: 'Test Task',
            description: 'Test Description',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T11:00:00Z'),
            status: TimelineStatus.UPCOMING,
            priority: 3,
          },
        ],
      };

      mockOpenAIProvider.parseTaskInput.mockResolvedValue(mockResponse);
      mockStorageService.getCache.mockResolvedValue(null);

      const result = await llmService.parseTaskInput('Create a test task');

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(mockOpenAIProvider.parseTaskInput).toHaveBeenCalledWith('Create a test task', undefined);
    });

    it('should return cached response when available', async () => {
      const cachedResponse = {
        success: true,
        tasks: [
          {
            title: 'Cached Task',
            description: 'Cached Description',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T11:00:00Z'),
            status: TimelineStatus.UPCOMING,
            priority: 3,
          },
        ],
      };

      mockStorageService.getCache.mockResolvedValue(cachedResponse);

      const result = await llmService.parseTaskInput('Create a test task');

      expect(result).toEqual(cachedResponse);
      expect(mockOpenAIProvider.parseTaskInput).not.toHaveBeenCalled();
    });

    it('should use fallback provider when primary fails', async () => {
      const config = {
        provider: mockProviderConfig,
        fallbackProvider: {
          name: 'anthropic' as const,
          model: 'claude-3-haiku-20240307',
          apiKey: 'test-anthropic-key',
        },
        cacheEnabled: true,
      };

      (LLMService as any).instance = null;
      llmService = LLMService.getInstance(config);

      const failureResponse = { success: false, error: 'Primary failed' };
      const successResponse = {
        success: true,
        tasks: [
          {
            title: 'Fallback Task',
            description: 'From fallback provider',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T11:00:00Z'),
            status: TimelineStatus.UPCOMING,
            priority: 3,
          },
        ],
      };

      mockOpenAIProvider.parseTaskInput.mockResolvedValue(failureResponse);
      mockAnthropicProvider.parseTaskInput.mockResolvedValue(successResponse);
      mockStorageService.getCache.mockResolvedValue(null);

      const result = await llmService.parseTaskInput('Create a test task');

      expect(result.success).toBe(true);
      expect(result.tasks?.[0].title).toBe('Fallback Task');
      expect(mockOpenAIProvider.parseTaskInput).toHaveBeenCalled();
      expect(mockAnthropicProvider.parseTaskInput).toHaveBeenCalled();
    });
  });

  describe('Status Updates', () => {
    it('should update task status successfully', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T11:00:00Z'),
          status: TimelineStatus.UPCOMING,
          priority: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        success: true,
        statusUpdates: [
          {
            taskId: '1',
            newStatus: TimelineStatus.COMPLETED,
            reason: 'Task completed',
            timestamp: new Date(),
          },
        ],
      };

      mockOpenAIProvider.updateTaskStatus.mockResolvedValue(mockResponse);

      const result = await llmService.updateTaskStatus('I finished the test task', mockTasks);

      expect(result.success).toBe(true);
      expect(result.statusUpdates).toHaveLength(1);
      expect(mockOpenAIProvider.updateTaskStatus).toHaveBeenCalledWith('I finished the test task', mockTasks);
    });
  });

  describe('Health Check', () => {
    it('should perform health check on providers', async () => {
      const health = await llmService.healthCheck();

      expect(health.primary.name).toBe('openai');
      expect(health.primary.healthy).toBe(true);
      expect(health.primary.configured).toBe(true);
      expect(mockOpenAIProvider.healthCheck).toHaveBeenCalled();
    });

    it('should check fallback provider if configured', async () => {
      const config = {
        provider: mockProviderConfig,
        fallbackProvider: {
          name: 'anthropic' as const,
          model: 'claude-3-haiku-20240307',
          apiKey: 'test-anthropic-key',
        },
      };

      (LLMService as any).instance = null;
      llmService = LLMService.getInstance(config);

      const health = await llmService.healthCheck();

      expect(health.primary.name).toBe('openai');
      expect(health.fallback?.name).toBe('anthropic');
      expect(mockOpenAIProvider.healthCheck).toHaveBeenCalled();
      expect(mockAnthropicProvider.healthCheck).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      await llmService.clearCache();
      expect(mockStorageService.clearCache).toHaveBeenCalled();
    });

    it('should cache successful responses', async () => {
      const mockResponse = {
        success: true,
        tasks: [
          {
            title: 'Test Task',
            description: 'Test Description',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T11:00:00Z'),
            status: TimelineStatus.UPCOMING,
            priority: 3,
          },
        ],
      };

      mockOpenAIProvider.parseTaskInput.mockResolvedValue(mockResponse);
      mockStorageService.getCache.mockResolvedValue(null);

      await llmService.parseTaskInput('Create a test task');

      expect(mockStorageService.setCache).toHaveBeenCalledWith(
        expect.any(String),
        mockResponse,
        60
      );
    });
  });

  describe('Response Validation', () => {
    it('should validate successful task response', () => {
      const response = {
        success: true,
        tasks: [
          {
            title: 'Valid Task',
            description: 'Valid Description',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T11:00:00Z'),
            priority: 3,
          },
        ],
      };

      const validation = LLMService.validateTaskResponse(response);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.sanitizedTasks).toHaveLength(1);
    });

    it('should detect invalid task response', () => {
      const response = {
        success: true,
        tasks: [
          {
            title: '',
            startTime: 'invalid-date',
            endTime: new Date('2023-01-01T10:00:00Z'),
          },
        ],
      };

      const validation = LLMService.validateTaskResponse(response);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});