import { LLMProvider } from './llm/providers/base';
import { OpenAIProvider } from './llm/providers/openai';
import { AnthropicProvider } from './llm/providers/anthropic';
import { LLMRequest, LLMResponse, LLMProvider as LLMProviderType } from '@/types/api';
import { Task, TimelineStatus } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';
import { storageService } from './storageService';

export interface LLMServiceConfig {
  provider: LLMProviderType;
  fallbackProvider?: LLMProviderType;
  cacheEnabled?: boolean;
  cacheTTL?: number; // in minutes
}

export class LLMService {
  private static instance: LLMService;
  private primaryProvider: LLMProvider | null = null;
  private fallbackProvider: LLMProvider | null = null;
  private config: LLMServiceConfig;
  private cacheEnabled: boolean;
  private cacheTTL: number;

  private constructor(config: LLMServiceConfig) {
    this.config = config;
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.cacheTTL = config.cacheTTL ?? 60; // 1 hour default
    this.initializeProviders();
  }

  public static getInstance(config?: LLMServiceConfig): LLMService {
    if (!LLMService.instance && config) {
      LLMService.instance = new LLMService(config);
    } else if (!LLMService.instance) {
      throw new Error('LLMService must be initialized with config first');
    }
    return LLMService.instance;
  }

  private initializeProviders(): void {
    // Initialize primary provider
    this.primaryProvider = this.createProvider(this.config.provider);
    
    // Initialize fallback provider if specified
    if (this.config.fallbackProvider) {
      this.fallbackProvider = this.createProvider(this.config.fallbackProvider);
    }
  }

  private createProvider(providerConfig: LLMProviderType): LLMProvider {
    switch (providerConfig.name) {
      case 'openai':
        return new OpenAIProvider({
          apiKey: providerConfig.apiKey,
          model: providerConfig.model,
          baseURL: providerConfig.baseURL,
        });
      case 'anthropic':
        return new AnthropicProvider({
          apiKey: providerConfig.apiKey,
          model: providerConfig.model,
          baseURL: providerConfig.baseURL,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${providerConfig.name}`);
    }
  }

  public updateConfig(config: Partial<LLMServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.provider) {
      this.primaryProvider = this.createProvider(config.provider);
    }
    
    if (config.fallbackProvider) {
      this.fallbackProvider = this.createProvider(config.fallbackProvider);
    }
    
    if (config.cacheEnabled !== undefined) {
      this.cacheEnabled = config.cacheEnabled;
    }
    
    if (config.cacheTTL !== undefined) {
      this.cacheTTL = config.cacheTTL;
    }
  }

  public async parseTaskInput(
    input: string,
    context?: Task[],
    useCache: boolean = true
  ): Promise<LLMResponse> {
    try {
      // Check cache first
      if (this.cacheEnabled && useCache) {
        const cacheKey = this.generateCacheKey('parse', input, context);
        const cached = await storageService.getCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Try primary provider
      let response = await this.tryProvider(
        this.primaryProvider,
        'parseTaskInput',
        input,
        context
      );

      // Try fallback provider if primary fails
      if (!response.success && this.fallbackProvider) {
        ErrorHandler.logError(
          new Error(`Primary provider failed: ${response.error}`),
          'LLMService.parseTaskInput'
        );
        
        response = await this.tryProvider(
          this.fallbackProvider,
          'parseTaskInput',
          input,
          context
        );
      }

      // Cache successful response
      if (response.success && this.cacheEnabled && useCache) {
        const cacheKey = this.generateCacheKey('parse', input, context);
        await storageService.setCache(cacheKey, response, this.cacheTTL);
      }

      return response;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMService.parseTaskInput');
      return {
        success: false,
        error: ErrorHandler.handleLLMError(error),
      };
    }
  }

  public async updateTaskStatus(
    input: string,
    tasks: Task[],
    useCache: boolean = false // Status updates shouldn't be cached
  ): Promise<LLMResponse> {
    try {
      // Try primary provider
      let response = await this.tryProvider(
        this.primaryProvider,
        'updateTaskStatus',
        input,
        tasks
      );

      // Try fallback provider if primary fails
      if (!response.success && this.fallbackProvider) {
        ErrorHandler.logError(
          new Error(`Primary provider failed: ${response.error}`),
          'LLMService.updateTaskStatus'
        );
        
        response = await this.tryProvider(
          this.fallbackProvider,
          'updateTaskStatus',
          input,
          tasks
        );
      }

      return response;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMService.updateTaskStatus');
      return {
        success: false,
        error: ErrorHandler.handleLLMError(error),
      };
    }
  }

  private async tryProvider(
    provider: LLMProvider | null,
    method: 'parseTaskInput' | 'updateTaskStatus',
    input: string,
    contextOrTasks?: Task[]
  ): Promise<LLMResponse> {
    if (!provider) {
      return {
        success: false,
        error: 'No provider available',
      };
    }

    if (!provider.isConfigured()) {
      return {
        success: false,
        error: `${provider.name} provider is not configured`,
      };
    }

    try {
      if (method === 'parseTaskInput') {
        return await provider.parseTaskInput(input, contextOrTasks);
      } else {
        return await provider.updateTaskStatus(input, contextOrTasks || []);
      }
    } catch (error) {
      return {
        success: false,
        error: ErrorHandler.handleLLMError(error),
      };
    }
  }

  public async healthCheck(): Promise<{
    primary: { name: string; healthy: boolean; configured: boolean };
    fallback?: { name: string; healthy: boolean; configured: boolean };
  }> {
    const result: any = {
      primary: {
        name: this.primaryProvider?.name || 'none',
        healthy: false,
        configured: this.primaryProvider?.isConfigured() || false,
      },
    };

    if (this.primaryProvider && this.primaryProvider.isConfigured()) {
      try {
        result.primary.healthy = await this.primaryProvider.healthCheck();
      } catch (error) {
        ErrorHandler.logError(error as Error, 'LLMService.healthCheck.primary');
      }
    }

    if (this.fallbackProvider) {
      result.fallback = {
        name: this.fallbackProvider.name,
        healthy: false,
        configured: this.fallbackProvider.isConfigured(),
      };

      if (this.fallbackProvider.isConfigured()) {
        try {
          result.fallback.healthy = await this.fallbackProvider.healthCheck();
        } catch (error) {
          ErrorHandler.logError(error as Error, 'LLMService.healthCheck.fallback');
        }
      }
    }

    return result;
  }

  public getProviderInfo(): {
    primary: { name: string; model: string; configured: boolean };
    fallback?: { name: string; model: string; configured: boolean };
  } {
    const result: any = {
      primary: {
        name: this.primaryProvider?.name || 'none',
        model: this.primaryProvider?.model || 'none',
        configured: this.primaryProvider?.isConfigured() || false,
      },
    };

    if (this.fallbackProvider) {
      result.fallback = {
        name: this.fallbackProvider.name,
        model: this.fallbackProvider.model,
        configured: this.fallbackProvider.isConfigured(),
      };
    }

    return result;
  }

  public async clearCache(): Promise<void> {
    try {
      await storageService.clearCache();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMService.clearCache');
    }
  }

  private generateCacheKey(
    operation: string,
    input: string,
    context?: Task[]
  ): string {
    const contextHash = context 
      ? context.map(t => `${t.id}:${t.status}`).join(',')
      : '';
    
    const inputHash = this.simpleHash(input);
    const contextHashValue = contextHash ? this.simpleHash(contextHash) : '';
    
    return `llm_${operation}_${inputHash}_${contextHashValue}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Utility method to validate and sanitize LLM responses
  public static validateTaskResponse(response: LLMResponse): {
    isValid: boolean;
    errors: string[];
    sanitizedTasks?: Task[];
  } {
    const errors: string[] = [];
    
    if (!response.success) {
      errors.push('Response indicates failure');
      return { isValid: false, errors };
    }

    if (!response.tasks || !Array.isArray(response.tasks)) {
      errors.push('Response missing tasks array');
      return { isValid: false, errors };
    }

    const sanitizedTasks: Task[] = [];
    
    for (let i = 0; i < response.tasks.length; i++) {
      const task = response.tasks[i];
      
      if (!task.title || typeof task.title !== 'string') {
        errors.push(`Task ${i}: Missing or invalid title`);
        continue;
      }

      if (!task.startTime || !task.endTime) {
        errors.push(`Task ${i}: Missing start or end time`);
        continue;
      }

      const startTime = new Date(task.startTime);
      const endTime = new Date(task.endTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        errors.push(`Task ${i}: Invalid date format`);
        continue;
      }

      if (startTime >= endTime) {
        errors.push(`Task ${i}: End time must be after start time`);
        continue;
      }

      // Create sanitized task
      const sanitizedTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title.trim(),
        description: task.description?.trim() || task.title.trim(),
        startTime,
        endTime,
        status: TimelineStatus.UPCOMING,
        priority: Math.max(1, Math.min(5, task.priority || 3)),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: task.metadata || {},
      };

      sanitizedTasks.push(sanitizedTask);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedTasks: sanitizedTasks.length > 0 ? sanitizedTasks : undefined,
    };
  }
}