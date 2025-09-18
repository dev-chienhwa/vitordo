import { Task, TimelineStatus } from '@/types/task';
import { LLMResponse } from '@/types/api';

// API Mock Responses
export const mockAPIResponses = {
  // OpenAI API responses
  openai: {
    success: {
      choices: [
        {
          message: {
            content: JSON.stringify({
              tasks: [
                {
                  title: 'Review project proposal',
                  description: 'Review the Q4 project proposal and provide feedback',
                  startTime: '2024-01-15T10:00:00Z',
                  endTime: '2024-01-15T11:00:00Z',
                  status: 'upcoming',
                  priority: 4,
                  estimatedDuration: 60,
                },
              ],
              confidence: 0.9,
            }),
          },
        },
      ],
    },
    statusUpdate: {
      choices: [
        {
          message: {
            content: JSON.stringify({
              statusUpdates: [
                {
                  taskId: 'task-1',
                  newStatus: 'recently_completed',
                  reason: 'Task completed as indicated by user input',
                  confidence: 0.95,
                },
              ],
            }),
          },
        },
      ],
    },
    error: {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_exceeded',
        code: 'rate_limit_exceeded',
      },
    },
  },

  // Anthropic API responses
  anthropic: {
    success: {
      content: [
        {
          text: JSON.stringify({
            tasks: [
              {
                title: 'Schedule team meeting',
                description: 'Schedule weekly team sync meeting',
                startTime: '2024-01-16T14:00:00Z',
                endTime: '2024-01-16T15:00:00Z',
                status: 'upcoming',
                priority: 3,
                estimatedDuration: 60,
              },
            ],
            confidence: 0.85,
          }),
        },
      ],
    },
    statusUpdate: {
      content: [
        {
          text: JSON.stringify({
            statusUpdates: [
              {
                taskId: 'task-2',
                newStatus: 'completed',
                reason: 'Task marked as completed',
                confidence: 0.9,
              },
            ],
          }),
        },
      ],
    },
    error: {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
      },
    },
  },
};

// Test Data Sets
export const testDataSets = {
  // Small dataset for unit tests
  small: {
    tasks: [
      {
        id: 'task-1',
        title: 'Morning standup',
        description: 'Daily team standup meeting',
        startTime: new Date('2024-01-15T09:00:00'),
        endTime: new Date('2024-01-15T09:30:00'),
        status: TimelineStatus.UPCOMING,
        priority: 3,
        createdAt: new Date('2024-01-14T08:00:00'),
        updatedAt: new Date('2024-01-14T08:00:00'),
      },
      {
        id: 'task-2',
        title: 'Code review',
        description: 'Review pull requests from team members',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T11:00:00'),
        status: TimelineStatus.RECENTLY_COMPLETED,
        priority: 4,
        createdAt: new Date('2024-01-14T09:00:00'),
        updatedAt: new Date('2024-01-15T11:00:00'),
      },
    ],
  },

  // Medium dataset for integration tests
  medium: Array.from({ length: 50 }, (_, i) => ({
    id: `task-${i + 1}`,
    title: `Task ${i + 1}`,
    description: `Description for task ${i + 1}`,
    startTime: new Date(Date.now() + i * 60 * 60 * 1000),
    endTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
    status: [TimelineStatus.UPCOMING, TimelineStatus.RECENTLY_COMPLETED, TimelineStatus.COMPLETED][i % 3],
    priority: (i % 5) + 1,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  })),

  // Large dataset for performance tests
  large: Array.from({ length: 1000 }, (_, i) => ({
    id: `task-${i + 1}`,
    title: `Performance Test Task ${i + 1}`,
    description: `This is a performance test task with ID ${i + 1}. It contains enough text to simulate real-world usage.`,
    startTime: new Date(Date.now() + i * 30 * 60 * 1000), // 30 minutes apart
    endTime: new Date(Date.now() + (i * 30 + 30) * 60 * 1000),
    status: [TimelineStatus.UPCOMING, TimelineStatus.RECENTLY_COMPLETED, TimelineStatus.COMPLETED][i % 3],
    priority: (i % 5) + 1,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    metadata: {
      originalInput: `Create task ${i + 1}`,
      llmResponse: `Generated task ${i + 1}`,
      estimatedDuration: 30 + (i % 4) * 15,
    },
  })),
};

// Mock Service Implementations
export const createMockLLMService = () => ({
  parseTaskInput: jest.fn().mockResolvedValue({
    success: true,
    tasks: testDataSets.small.tasks,
    confidence: 0.9,
  }),
  updateTaskStatus: jest.fn().mockResolvedValue({
    success: true,
    statusUpdates: [
      {
        taskId: 'task-1',
        newStatus: TimelineStatus.RECENTLY_COMPLETED,
        reason: 'Task completed',
        timestamp: new Date(),
      },
    ],
  }),
  healthCheck: jest.fn().mockResolvedValue(true),
  configure: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(true),
});

export const createMockStorageService = () => ({
  saveTasks: jest.fn().mockResolvedValue(undefined),
  loadTasks: jest.fn().mockResolvedValue(testDataSets.small.tasks),
  saveTask: jest.fn().mockResolvedValue(undefined),
  deleteTask: jest.fn().mockResolvedValue(undefined),
  saveTimelineEvent: jest.fn().mockResolvedValue(undefined),
  getTasksByDateRange: jest.fn().mockResolvedValue([]),
  exportData: jest.fn().mockResolvedValue({}),
  importData: jest.fn().mockResolvedValue(undefined),
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
});

export const createMockTaskService = () => ({
  processUserInput: jest.fn().mockResolvedValue({
    success: true,
    tasks: testDataSets.small.tasks,
    confidence: 0.9,
  }),
  updateTaskStatus: jest.fn().mockResolvedValue({
    success: true,
    updatedTasks: [testDataSets.small.tasks[0]],
    statusUpdates: [
      {
        taskId: 'task-1',
        newStatus: TimelineStatus.RECENTLY_COMPLETED,
        reason: 'Task completed',
        timestamp: new Date(),
      },
    ],
  }),
  getTasksByStatus: jest.fn().mockReturnValue([]),
  getTasksByDateRange: jest.fn().mockResolvedValue([]),
  sortTasks: jest.fn().mockReturnValue([]),
  validateTaskData: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  getTaskStatistics: jest.fn().mockReturnValue({
    total: 2,
    completed: 0,
    recentlyCompleted: 1,
    upcoming: 1,
    overdue: 0,
    completionRate: 50,
  }),
  cleanupOldTasks: jest.fn().mockResolvedValue(0),
  exportTasks: jest.fn().mockResolvedValue('{}'),
  importTasks: jest.fn().mockResolvedValue(true),
});

// Mock Store Implementations
export const createMockTaskStore = () => ({
  tasks: testDataSets.small.tasks,
  isLoading: false,
  error: null,
  currentInput: '',
  setTasks: jest.fn(),
  addTask: jest.fn(),
  addTasks: jest.fn(),
  updateTask: jest.fn(),
  removeTask: jest.fn(),
  updateTaskStatus: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  setCurrentInput: jest.fn(),
  getTaskById: jest.fn((id) => testDataSets.small.tasks.find(t => t.id === id)),
  getTasksByStatus: jest.fn((status) => testDataSets.small.tasks.filter(t => t.status === status)),
  completedTasks: testDataSets.small.tasks.filter(t => t.status === TimelineStatus.COMPLETED),
  upcomingTasks: testDataSets.small.tasks.filter(t => t.status === TimelineStatus.UPCOMING),
  recentlyCompletedTasks: testDataSets.small.tasks.filter(t => t.status === TimelineStatus.RECENTLY_COMPLETED),
});

export const createMockUIStore = () => ({
  notifications: [],
  theme: 'light' as const,
  sidebarOpen: true,
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
  clearNotifications: jest.fn(),
  setTheme: jest.fn(),
  toggleSidebar: jest.fn(),
});

// Test Scenarios
export const testScenarios = {
  // Happy path scenarios
  happyPath: {
    createTask: {
      input: 'Schedule a meeting with the team tomorrow at 2 PM',
      expectedOutput: {
        success: true,
        tasks: [
          {
            title: 'Team meeting',
            description: 'Schedule a meeting with the team',
            status: TimelineStatus.UPCOMING,
            priority: 3,
          },
        ],
      },
    },
    updateStatus: {
      input: 'I finished the team meeting',
      expectedOutput: {
        success: true,
        statusUpdates: [
          {
            newStatus: TimelineStatus.RECENTLY_COMPLETED,
            reason: 'Task completed',
          },
        ],
      },
    },
  },

  // Error scenarios
  errorCases: {
    invalidInput: {
      input: '',
      expectedError: 'Input cannot be empty',
    },
    networkError: {
      input: 'Create a task',
      mockError: new Error('Network error'),
      expectedError: 'Network error',
    },
    apiError: {
      input: 'Create a task',
      mockResponse: { error: 'API rate limit exceeded' },
      expectedError: 'API rate limit exceeded',
    },
  },

  // Edge cases
  edgeCases: {
    veryLongInput: {
      input: 'a'.repeat(10000),
      expectedError: 'Input too long',
    },
    specialCharacters: {
      input: 'Create task with émojis 🚀 and spëcial chars',
      shouldSucceed: true,
    },
    multipleLanguages: {
      input: '创建一个任务 for tomorrow',
      shouldSucceed: true,
    },
  },
};

// Performance benchmarks
export const performanceBenchmarks = {
  componentRender: {
    maxTime: 100, // milliseconds
    description: 'Component should render within 100ms',
  },
  apiResponse: {
    maxTime: 5000, // milliseconds
    description: 'API calls should complete within 5 seconds',
  },
  searchFilter: {
    maxTime: 50, // milliseconds
    description: 'Search filtering should complete within 50ms',
  },
  stateUpdate: {
    maxTime: 10, // milliseconds
    description: 'State updates should complete within 10ms',
  },
};