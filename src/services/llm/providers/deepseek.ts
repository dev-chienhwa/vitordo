import { LLMProvider } from './base';
import { LLMRequest, LLMResponse } from '@/types/api';
import { Task } from '@/types/task';
import axios, { AxiosResponse } from 'axios';

export class DeepSeekProvider extends LLMProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey: string, options?: {
    baseURL?: string;
    model?: string;
  }) {
    super();
    this.apiKey = apiKey;
    this.baseURL = options?.baseURL || 'https://api.deepseek.com/v1';
    this.model = options?.model || 'deepseek-reasoner';
  }

  async parseTaskInput(request: LLMRequest): Promise<LLMResponse> {
    try {
      const prompt = this.buildTaskParsingPrompt(request.input, request.context);
      
      const response = await this.makeAPICall({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a task management assistant. Parse natural language input into structured task data.
            
IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

Response format:
{
  "success": true,
  "tasks": [
    {
      "title": "Task title",
      "description": "Optional description",
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T11:00:00.000Z",
      "priority": 3,
      "tags": ["optional", "tags"],
      "category": "optional category"
    }
  ],
  "confidence": 0.95,
  "reasoning": "Brief explanation of parsing decisions"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DeepSeek API call failed',
        tasks: [],
      };
    }
  }

  async updateTaskStatus(request: LLMRequest): Promise<LLMResponse> {
    try {
      const prompt = this.buildStatusUpdatePrompt(request.input, request.context);
      
      const response = await this.makeAPICall({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a task management assistant. Analyze user input to determine which tasks should have their status updated.

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

Response format:
{
  "success": true,
  "updatedTasks": [
    {
      "id": "task-id",
      "status": "recently_completed",
      "reason": "User indicated completion"
    }
  ],
  "confidence": 0.95,
  "reasoning": "Brief explanation of status update decisions"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      return this.parseStatusResponse(response.data);
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DeepSeek API call failed',
        updatedTasks: [],
      };
    }
  }

  private async makeAPICall(payload: any): Promise<AxiosResponse> {
    return axios.post(`${this.baseURL}/chat/completions`, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  private parseResponse(data: any): LLMResponse {
    try {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // DeepSeek Reasoner可能会返回reasoning过程，我们需要提取JSON部分
      let jsonContent = content;
      
      // 如果响应包含reasoning标记，提取JSON部分
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      
      // 验证响应格式
      if (!parsed.success && parsed.success !== false) {
        throw new Error('Invalid response format: missing success field');
      }

      return {
        success: parsed.success,
        tasks: parsed.tasks || [],
        error: parsed.error,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Failed to parse DeepSeek response:', error);
      return {
        success: false,
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tasks: [],
      };
    }
  }

  private parseStatusResponse(data: any): LLMResponse {
    try {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // 同样处理reasoning响应
      let jsonContent = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      
      return {
        success: parsed.success,
        updatedTasks: parsed.updatedTasks || [],
        error: parsed.error,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Failed to parse DeepSeek status response:', error);
      return {
        success: false,
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        updatedTasks: [],
      };
    }
  }

  private buildTaskParsingPrompt(input: string, context?: Task[]): string {
    let prompt = `Parse this natural language input into structured tasks: "${input}"\n\n`;
    
    if (context && context.length > 0) {
      prompt += `Current tasks for context:\n`;
      context.forEach((task, index) => {
        prompt += `${index + 1}. ${task.title} (${task.status}) - ${task.startTime}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Current time: ${new Date().toISOString()}\n\n`;
    prompt += `Please extract tasks with realistic time estimates and appropriate priorities (1-5 scale).`;
    
    return prompt;
  }

  private buildStatusUpdatePrompt(input: string, context?: Task[]): string {
    let prompt = `Analyze this user input for task status updates: "${input}"\n\n`;
    
    if (context && context.length > 0) {
      prompt += `Current tasks:\n`;
      context.forEach((task, index) => {
        prompt += `${index + 1}. ID: ${task.id}, Title: ${task.title}, Status: ${task.status}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Determine which tasks should be updated based on the user's input. `;
    prompt += `Valid statuses: "upcoming", "recently_completed", "completed"`;
    
    return prompt;
  }
}