import { BaseLLMProvider, LLMProviderConfig, LLMRequestOptions } from './base';
import { LLMResponse } from '@/types/api';
import { Task, TimelineStatus } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';

export class AnthropicProvider extends BaseLLMProvider {
  private readonly baseURL: string;

  constructor(config?: Partial<LLMProviderConfig>) {
    super('anthropic', config?.model || 'claude-3-haiku-20240307', config);
    this.baseURL = config?.baseURL || 'https://api.anthropic.com/v1';
  }

  async parseTaskInput(input: string, context?: Task[]): Promise<LLMResponse> {
    this.validateInput(input);

    if (!this.isConfigured()) {
      throw new Error('Anthropic provider is not configured');
    }

    try {
      const prompt = this.buildTaskParsingPrompt(input, context);
      const response = await this.makeAnthropicRequest(prompt);
      
      return this.parseTaskParsingResponse(response);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'AnthropicProvider.parseTaskInput');
      return {
        success: false,
        error: ErrorHandler.handleLLMError(error),
      };
    }
  }

  async updateTaskStatus(input: string, tasks: Task[]): Promise<LLMResponse> {
    this.validateInput(input);

    if (!this.isConfigured()) {
      throw new Error('Anthropic provider is not configured');
    }

    try {
      const prompt = this.buildStatusUpdatePrompt(input, tasks);
      const response = await this.makeAnthropicRequest(prompt);
      
      return this.parseStatusUpdateResponse(response);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'AnthropicProvider.updateTaskStatus');
      return {
        success: false,
        error: ErrorHandler.handleLLMError(error),
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await this.makeAnthropicRequest(
        'Respond with "OK" if you can process this request.',
        { maxTokens: 10, temperature: 0 }
      );
      
      return response.content?.[0]?.text?.includes('OK') || false;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'AnthropicProvider.healthCheck');
      return false;
    }
  }

  private async makeAnthropicRequest(
    prompt: string,
    options?: LLMRequestOptions
  ): Promise<any> {
    const payload = {
      model: this.config.model,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
    };

    return await this.makeRequest(`${this.baseURL}/messages`, payload, {
      ...options,
      // Override makeRequest to use custom headers
    });
  }

  // Override makeRequest to handle Anthropic-specific headers
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
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
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

  private buildTaskParsingPrompt(input: string, context?: Task[]): string {
    const currentTime = new Date().toISOString();
    const contextInfo = context && context.length > 0 
      ? `\n\nExisting tasks for context:\n${context.map(task => 
          `- ${task.title}: ${task.status} (${task.startTime.toISOString()} - ${task.endTime.toISOString()})`
        ).join('\n')}`
      : '';

    return `You are a task management assistant. Parse the following input and extract tasks with their details.

Current time: ${currentTime}${contextInfo}

User input: "${input}"

Please respond with a JSON object containing an array of tasks. Each task should have:
- title: Brief descriptive title
- description: More detailed description
- startTime: ISO date string for when the task should start
- endTime: ISO date string for when the task should end
- status: Always "upcoming" for new tasks
- priority: Number from 1-5 (1=lowest, 5=highest, default=3)
- estimatedDuration: Duration in minutes

Guidelines:
- If no specific time is mentioned, schedule during working hours (9 AM - 5 PM)
- Default duration is 30 minutes if not specified
- Ensure endTime is after startTime
- Break down complex requests into multiple tasks if appropriate

Respond only with valid JSON in this format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "startTime": "2023-01-01T10:00:00Z",
      "endTime": "2023-01-01T10:30:00Z",
      "status": "upcoming",
      "priority": 3,
      "estimatedDuration": 30
    }
  ],
  "confidence": 0.8
}`;
  }

  private buildStatusUpdatePrompt(input: string, tasks: Task[]): string {
    const tasksInfo = tasks.map(task => 
      `ID: ${task.id}, Title: "${task.title}", Status: ${task.status}, Time: ${task.startTime.toISOString()} - ${task.endTime.toISOString()}`
    ).join('\n');

    return `You are a task management assistant. Analyze the user input to identify task status updates.

Current tasks:
${tasksInfo}

User input: "${input}"

Determine if the input indicates any task completions or status changes. Respond with JSON containing status updates.

Status options:
- "completed": For older finished tasks
- "recently_completed": For tasks just finished
- "upcoming": For tasks that are reset or postponed

Respond only with valid JSON in this format:
{
  "statusUpdates": [
    {
      "taskId": "task_id_or_null_if_not_identifiable",
      "newStatus": "completed",
      "reason": "Explanation of the status change",
      "confidence": 0.9
    }
  ]
}

If no status updates are detected, return an empty statusUpdates array.`;
  }

  private parseTaskParsingResponse(response: any): LLMResponse {
    try {
      const content = response.content?.[0]?.text;
      if (!content) {
        throw new Error('No content in response');
      }

      // Extract JSON from the response (Claude sometimes includes extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid response format: missing tasks array');
      }

      // Validate and transform tasks
      const tasks = parsed.tasks.map((task: any) => ({
        title: task.title || 'Untitled Task',
        description: task.description || task.title || 'No description',
        startTime: new Date(task.startTime),
        endTime: new Date(task.endTime),
        status: TimelineStatus.UPCOMING,
        priority: Math.max(1, Math.min(5, task.priority || 3)),
        metadata: {
          estimatedDuration: task.estimatedDuration || 30,
          llmResponse: content,
        },
      }));

      // Validate dates
      for (const task of tasks) {
        if (isNaN(task.startTime.getTime()) || isNaN(task.endTime.getTime())) {
          throw new Error('Invalid date format in task');
        }
        if (task.startTime >= task.endTime) {
          // Fix invalid time range
          task.endTime = new Date(task.startTime.getTime() + 30 * 60 * 1000); // 30 minutes later
        }
      }

      return {
        tasks,
        success: true,
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      ErrorHandler.logError(error as Error, 'AnthropicProvider.parseTaskParsingResponse');
      return {
        success: false,
        error: `Failed to parse response: ${error}`,
      };
    }
  }

  private parseStatusUpdateResponse(response: any): LLMResponse {
    try {
      const content = response.content?.[0]?.text;
      if (!content) {
        throw new Error('No content in response');
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          statusUpdates: [],
          success: true,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.statusUpdates || !Array.isArray(parsed.statusUpdates)) {
        return {
          statusUpdates: [],
          success: true,
        };
      }

      const statusUpdates = parsed.statusUpdates.map((update: any) => ({
        taskId: update.taskId || null,
        newStatus: update.newStatus as TimelineStatus,
        reason: update.reason || 'Status update detected',
        timestamp: new Date(),
      }));

      return {
        statusUpdates,
        success: true,
      };
    } catch (error) {
      ErrorHandler.logError(error as Error, 'AnthropicProvider.parseStatusUpdateResponse');
      return {
        success: false,
        error: `Failed to parse status update response: ${error}`,
      };
    }
  }
}