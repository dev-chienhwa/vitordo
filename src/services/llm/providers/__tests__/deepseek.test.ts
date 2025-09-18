import { DeepSeekProvider } from '../deepseek';
import { LLMRequest } from '@/types/api';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider;
  const mockApiKey = 'test-deepseek-key';

  beforeEach(() => {
    provider = new DeepSeekProvider(mockApiKey);
    jest.clearAllMocks();
  });

  describe('parseTaskInput', () => {
    it('should parse simple task input successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                tasks: [{
                  title: 'Meeting with John',
                  description: 'Discuss project updates',
                  startTime: '2024-01-01T14:00:00.000Z',
                  endTime: '2024-01-01T15:00:00.000Z',
                  priority: 3,
                  tags: ['work', 'meeting'],
                  category: 'work'
                }],
                confidence: 0.95,
                reasoning: 'Parsed a single meeting task with appropriate timing'
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        input: 'Schedule a meeting with John tomorrow at 2 PM',
        requestType: 'parse'
      };

      const result = await provider.parseTaskInput(request);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks![0].title).toBe('Meeting with John');
      expect(result.confidence).toBe(0.95);
      expect(result.reasoning).toBe('Parsed a single meeting task with appropriate timing');
    });

    it('should handle reasoning-wrapped responses', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `<reasoning>
The user wants to schedule a meeting. I need to extract the key details...
</reasoning>

\`\`\`json
{
  "success": true,
  "tasks": [{
    "title": "Team standup",
    "startTime": "2024-01-01T09:00:00.000Z",
    "endTime": "2024-01-01T09:30:00.000Z",
    "priority": 2
  }],
  "confidence": 0.9
}
\`\`\``
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        input: 'Daily standup at 9 AM',
        requestType: 'parse'
      };

      const result = await provider.parseTaskInput(request);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks![0].title).toBe('Team standup');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const request: LLMRequest = {
        input: 'Schedule a meeting',
        requestType: 'parse'
      };

      const result = await provider.parseTaskInput(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(result.tasks).toEqual([]);
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: 'This is not valid JSON'
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        input: 'Schedule a meeting',
        requestType: 'parse'
      };

      const result = await provider.parseTaskInput(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse response');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                updatedTasks: [{
                  id: 'task-1',
                  status: 'recently_completed',
                  reason: 'User indicated completion'
                }],
                confidence: 0.9,
                reasoning: 'User mentioned finishing the meeting'
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        input: 'I finished the meeting with John',
        context: [{
          id: 'task-1',
          title: 'Meeting with John',
          status: 'upcoming',
          startTime: new Date(),
          endTime: new Date(),
          priority: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        requestType: 'update'
      };

      const result = await provider.updateTaskStatus(request);

      expect(result.success).toBe(true);
      expect(result.updatedTasks).toHaveLength(1);
      expect(result.updatedTasks![0].id).toBe('task-1');
      expect(result.updatedTasks![0].status).toBe('recently_completed');
    });

    it('should make correct API call with proper headers', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                tasks: []
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        input: 'Schedule a meeting',
        requestType: 'parse'
      };

      await provider.parseTaskInput(request);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          model: 'deepseek-reasoner',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system'
            }),
            expect.objectContaining({
              role: 'user'
            })
          ]),
          temperature: 0.1,
          max_tokens: 2000
        }),
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        })
      );
    });
  });

  describe('custom configuration', () => {
    it('should use custom baseURL and model', async () => {
      const customProvider = new DeepSeekProvider(mockApiKey, {
        baseURL: 'https://custom.deepseek.com/v1',
        model: 'deepseek-reasoner-v2'
      });

      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                tasks: []
              })
            }
          }]
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const request: LLMRequest = {
        input: 'Test input',
        requestType: 'parse'
      };

      await customProvider.parseTaskInput(request);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://custom.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          model: 'deepseek-reasoner-v2'
        }),
        expect.any(Object)
      );
    });
  });
});