// API-related type definitions

import { Task, TaskUpdate, TimelineStatus } from './task';

export interface LLMRequest {
  input: string;
  context?: Task[];
  userId?: string;
  requestType: 'parse' | 'update';
}

export interface LLMResponse {
  tasks?: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[];
  updatedTasks?: Array<{
    id: string;
    status: TimelineStatus;
    reason?: string;
  }>;
  statusUpdates?: TaskUpdate[];
  success: boolean;
  error?: string;
  confidence?: number;
  reasoning?: string;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface LLMProvider {
  name: 'openai' | 'anthropic' | 'deepseek';
  model: string;
  apiKey: string;
  baseURL?: string;
}

export type LLMProviderType = 'openai' | 'anthropic' | 'deepseek';

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}