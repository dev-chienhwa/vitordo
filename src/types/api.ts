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
  statusUpdates?: TaskUpdate[];
  success: boolean;
  error?: string;
  confidence?: number;
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
  name: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  baseURL?: string;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}