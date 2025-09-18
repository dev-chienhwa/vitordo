import { BaseLLMProvider, LLMProviderConfig, LLMRequestOptions } from './base';
import { LLMResponse } from '@/types/api';
import { Task, TimelineStatus } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';

export class OpenAIProvider extends BaseLLMProvider {
  private readonly baseURL: string;

  constructor(config?: Partial<LLMProviderConfig>) {
    super('openai', config?.model || 'gpt-3.5-turbo', config);
    this.baseURL = config?.baseURL || 'https://api.openai.com/v1';
  }

  async parseTaskInput(input: string, context?: Task[]): Promise<LLMResponse> {
    this.validateInput(input);

    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured');
    }

    try {
      const prompt = this.buildTaskParsingPrompt(input, context);
      const response = await this.makeOpenAIRequest(prompt);
      
      return this.parseTaskParsingResponse(response);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'OpenAIProvider.parseTaskInput');
      return {
        success: false,
        error: ErrorHandler.handleLLMError(error),
      };
    }
  }

  async updateTaskStatus(input: string, tasks: Task[]): Promise<LLMResponse> {
    this.validateInput(input);

    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured');
    }

    try {
      const prompt = this.buildStatusUpdatePrompt(input, tasks);
      const response = await this.makeOpenAIRequest(prompt);
      
      return this.parseStatusUpdateResponse(response);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'OpenAIProvider.updateTaskStatus');
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
      const response = await this.makeOpenAIRequest(
        'Respond with "OK" if you can process this request.',
        { maxTokens: 10, temperature: 0 }
      );
      
      return response.choices?.[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'OpenAIProvider.healthCheck');
      return false;
    }
  }

  private async makeOpenAIRequest(
    prompt: string,
    options?: LLMRequestOptions
  ): Promise<any> {
    const payload = {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that processes task management requests. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature,
      response_format: { type: 'json_object' },
    };

    return await this.makeRequest(`${this.baseURL}/chat/completions`, payload, options);
  }

  private buildTaskParsingPrompt(input: string, context?: Task[]): string {
    const currentTime = new Date().toISOString();
    const contextInfo = context && context.length > 0 
      ? `\n\nExisting tasks for context:\n${context.map(task => 
          `- ${task.title}: ${task.status} (${task.startTime.toISOString()} - ${task.endTime.toISOString()})`
        ).join('\n')}`
      : '';

    return `Parse the following task input and return a JSON response with an array of tasks.

Current time: ${currentTime}${contextInfo}

User input: "${input}"

Return a JSON object with this structure:
{
  "tasks": [
    {
      "title": "Brief task title",
      "description": "Detailed description",
      "startTime": "ISO date string",
      "endTime": "ISO date string",
      "status": "upcoming",
      "priority": 1-5,
      "estimatedDuration": "duration in minutes"
    }
  ],
  "confidence": 0.0-1.0
}

Rules:
- If no specific time is mentioned, schedule tasks during working hours (9 AM - 5 PM)
- Default task duration is 30 minutes if not specified
- Priority: 1=lowest, 5=highest (default: 3)
- Status should always be "upcoming" for new tasks
- Ensure endTime is after startTime
- If multiple tasks are mentioned, create separate entries for each`;
  }

  private buildStatusUpdatePrompt(input: string, tasks: Task[]): string {
    const tasksInfo = tasks.map(task => 
      `ID: ${task.id}, Title: "${task.title}", Status: ${task.status}, Time: ${task.startTime.toISOString()} - ${task.endTime.toISOString()}`
    ).join('\n');

    return `Analyze the following input to identify task status updates.

Existing tasks:
${tasksInfo}

User input: "${input}"

Return a JSON object with this structure:
{
  "statusUpdates": [
    {
      "taskId": "task_id_if_identifiable",
      "newStatus": "completed|recently_completed|upcoming",
      "reason": "explanation of the status change",
      "confidence": 0.0-1.0
    }
  ]
}

Rules:
- Only return updates if the input clearly indicates task completion or status changes
- Use "recently_completed" for tasks just finished
- Use "completed" for older finished tasks
- Use "upcoming" for tasks that are reset or postponed
- If you can't identify a specific task, set taskId to null and include a general description
- Confidence should reflect how certain you are about the interpretation`;
  }

  private parseTaskParsingResponse(response: any): LLMResponse {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      const parsed = JSON.parse(content);
      
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
      ErrorHandler.logError(error as Error, 'OpenAIProvider.parseTaskParsingResponse');
      return {
        success: false,
        error: `Failed to parse response: ${error}`,
      };
    }
  }

  private parseStatusUpdateResponse(response: any): LLMResponse {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      const parsed = JSON.parse(content);
      
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
      ErrorHandler.logError(error as Error, 'OpenAIProvider.parseStatusUpdateResponse');
      return {
        success: false,
        error: `Failed to parse status update response: ${error}`,
      };
    }
  }
}