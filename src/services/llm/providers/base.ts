import { LLMRequest, LLMResponse, APIError } from '@/types/api';
import { Task } from '@/types/task';

// Base interface for all LLM providers
export interface LLMProvider {
  name: string;
  model: string;
  
  // Core methods
  parseTaskInput(input: string, context?: Task[]): Promise<LLMResponse>;
  updateTaskStatus(input: string, tasks: Task[]): Promise<LLMResponse>;
  
  // Configuration
  configure(config: LLMProviderConfig): void;
  isConfigured(): boolean;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

export interface LLMProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  timeout?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  temperature?: number;
  maxTokens?: number;
}

// Abstract base class for LLM providers
export abstract class BaseLLMProvider implements LLMProvider {
  protected config: LLMProviderConfig;
  protected defaultOptions: LLMRequestOptions;

  constructor(
    public name: string,
    public model: string,
    config?: Partial<LLMProviderConfig>
  ) {
    this.config = {
      apiKey: '',
      model: this.model,
      timeout: 30000,
      maxTokens: 1000,
      temperature: 0.7,
      ...config,
    };

    this.defaultOptions = {
      timeout: this.config.timeout,
      retries: 3,
      retryDelay: 1000,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };
  }

  configure(config: LLMProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.length > 0);
  }

  // Abstract methods to be implemented by specific providers
  abstract parseTaskInput(input: string, context?: Task[]): Promise<LLMResponse>;
  abstract updateTaskStatus(input: string, tasks: Task[]): Promise<LLMResponse>;
  abstract healthCheck(): Promise<boolean>;

  // Common utility methods
  protected async makeRequest(
    url: string,
    payload: any,
    options?: LLMRequestOptions
  ): Promise<any> {
    const requestOptions = { ...this.defaultOptions, ...options };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= (requestOptions.retries || 1); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, requestOptions.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw await this.handleHTTPError(response);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < (requestOptions.retries || 1)) {
          await this.delay(requestOptions.retryDelay || 1000);
          continue;
        }
      }
    }

    throw lastError;
  }

  protected async handleHTTPError(response: Response): Promise<APIError> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, use status text
    }

    const error: APIError = {
      code: this.mapHTTPStatusToErrorCode(response.status),
      message: errorData.error?.message || response.statusText || 'Unknown error',
      details: errorData,
      timestamp: new Date(),
    };

    return error;
  }

  protected mapHTTPStatusToErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'INVALID_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 429:
        return 'RATE_LIMIT';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
      case 503:
      case 504:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateInput(input: string): void {
    if (!input || input.trim().length === 0) {
      throw new Error('Input cannot be empty');
    }

    if (input.length > 10000) {
      throw new Error('Input is too long (max 10000 characters)');
    }
  }

  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}