import { TaskService } from '../taskService';
import { LLMService } from '../llmService';
import { TimelineStatus } from '@/types/task';

// Mock dependencies
jest.mock('../llmService');
jest.mock('../storageService');
jest.mock('@/stores/taskStore');
jest.mock('@/stores/uiStore');

const mockLLMService = {
  parseTaskInput: jest.fn(),
  updateTaskStatus: jest.fn(),
  validateTaskResponse: jest.fn(),
};

const mockTaskStore = {
  getState: jest.fn(() => ({
    tasks: [],
    setLoading: jest.fn(),
    setError: jest.fn(),
    addTasks: jest.fn(),
    updateTask: jest.fn(),
    removeTask: jest.fn(),
    setTasks: jest.fn(),
    getTasksByStatus: jest.fn(() => []),
  })),
};

const mockUIStore = {
  getState: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
};

const mockStorageService = {
  saveTasks: jest.fn(),
  saveTimelineEvent: jest.fn(),
  getTasksByDateRange: jest.fn(),
  loadTasks: jest.fn(),
  exportData: jest.fn(),
  importData: jest.fn(),
  deleteTask: jest.fn(),
};

// Setup mocks
jest.mock('@/stores/taskStore', () => ({
  useTaskStore: mockTaskStore,
}));

jest.mock('@/stores/uiStore', () => ({
  useUIStore: mockUIStore,
}));

jest.mock('../storageService', () => ({
  storageService: mockStorageService,
}));

describe('TaskService', () => {
  let taskService: TaskService;
  let llmService: LLMService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    (TaskService as any).instance = null;
    
    taskService = TaskService.getInstance({
      autoSave: true,
      validateInput: true,
      enableNotifications: true,
    });

    llmService = mockLLMService as any;
    taskService.setLLMService(llmService);
  });

  describe('Process User Input', () => {
    it('should process user input successfully', async () => {
      const mockTasks = [
        {
          title: 'Test Task',
          description: 'Test Description',
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T11:00:00Z'),
          status: TimelineStatus.UPCOMING,
          priority: 3,
        },
      ];

      const mockLLMResponse = {
        success: true,
        tasks: mockTasks,
        confidence: 0.9,
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        sanitizedTasks: mockTasks.map(task => ({
          ...task,
          id: 'task_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };

      mockLLMService.parseTaskInput.mockResolvedValue(mockLLMResponse);
      (LLMService.validateTaskResponse as jest.Mock).mockReturnValue(mockValidation);

      const result = await taskService.processUserInput('Create a test task');

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.confidence).toBe(0.9);
      expect(mockLLMService.parseTaskInput).toHaveBeenCalledWith('Create a test task', []);
      expect(mockStorageService.saveTasks).toHaveBeenCalled();
      expect(mockTaskStore.getState().addTasks).toHaveBeenCalled();
    });

    it('should handle invalid input', async () => {
      const result = await taskService.processUserInput('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Input cannot be empty');
      expect(mockLLMService.parseTaskInput).not.toHaveBeenCalled();
    });

    it('should handle LLM service failure', async () => {
      const mockLLMResponse = {
        success: false,
        error: 'LLM service failed',
      };

      mockLLMService.parseTaskInput.mockResolvedValue(mockLLMResponse);

      const result = await taskService.processUserInput('Create a test task');

      expect(result.success).toBe(false);
      expect(result.error).toContain('LLM service failed');
      expect(mockTaskStore.getState().setError).toHaveBeenCalled();
    });

    it('should handle missing LLM service', async () => {
      taskService.setLLMService(null as any);

      const result = await taskService.processUserInput('Create a test task');

      expect(result.success).toBe(false);
      expect(result.error).toBe('LLM service is not configured');
    });
  });

  describe('Update Task Status', () => {
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

    beforeEach(() => {
      mockTaskStore.getState.mockReturnValue({
        ...mockTaskStore.getState(),
        tasks: mockTasks,
      });
    });

    it('should update task status successfully', async () => {
      const mockStatusUpdates = [
        {
          taskId: '1',
          newStatus: TimelineStatus.COMPLETED,
          reason: 'Task completed',
          timestamp: new Date(),
        },
      ];

      const mockLLMResponse = {
        success: true,
        statusUpdates: mockStatusUpdates,
      };

      mockLLMService.updateTaskStatus.mockResolvedValue(mockLLMResponse);

      const result = await taskService.updateTaskStatus('I finished the test task');

      expect(result.success).toBe(true);
      expect(result.updatedTasks).toHaveLength(1);
      expect(result.statusUpdates).toHaveLength(1);
      expect(mockLLMService.updateTaskStatus).toHaveBeenCalledWith('I finished the test task', mockTasks);
    });

    it('should handle no status updates', async () => {
      const mockLLMResponse = {
        success: true,
        statusUpdates: [],
      };

      mockLLMService.updateTaskStatus.mockResolvedValue(mockLLMResponse);

      const result = await taskService.updateTaskStatus('Just checking in');

      expect(result.success).toBe(true);
      expect(result.updatedTasks).toHaveLength(0);
      expect(result.statusUpdates).toHaveLength(0);
    });

    it('should handle no existing tasks', async () => {
      mockTaskStore.getState.mockReturnValue({
        ...mockTaskStore.getState(),
        tasks: [],
      });

      const result = await taskService.updateTaskStatus('Update status');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tasks available to update');
    });
  });

  describe('Task Management', () => {
    const mockTasks = [
      {
        id: '1',
        title: 'High Priority Task',
        description: 'Important task',
        startTime: new Date('2023-01-01T10:00:00Z'),
        endTime: new Date('2023-01-01T11:00:00Z'),
        status: TimelineStatus.UPCOMING,
        priority: 5,
        createdAt: new Date('2023-01-01T09:00:00Z'),
        updatedAt: new Date('2023-01-01T09:00:00Z'),
      },
      {
        id: '2',
        title: 'Low Priority Task',
        description: 'Less important task',
        startTime: new Date('2023-01-01T11:00:00Z'),
        endTime: new Date('2023-01-01T12:00:00Z'),
        status: TimelineStatus.COMPLETED,
        priority: 1,
        createdAt: new Date('2023-01-01T08:00:00Z'),
        updatedAt: new Date('2023-01-01T08:00:00Z'),
      },
    ];

    it('should get tasks by status', () => {
      mockTaskStore.getState.mockReturnValue({
        ...mockTaskStore.getState(),
        getTasksByStatus: jest.fn((status) => 
          mockTasks.filter(task => task.status === status)
        ),
      });

      const upcomingTasks = taskService.getTasksByStatus(TimelineStatus.UPCOMING);
      const completedTasks = taskService.getTasksByStatus(TimelineStatus.COMPLETED);

      expect(upcomingTasks).toHaveLength(1);
      expect(completedTasks).toHaveLength(1);
      expect(upcomingTasks[0].title).toBe('High Priority Task');
    });

    it('should sort tasks by priority', () => {
      const sortedTasks = taskService.sortTasks(mockTasks, 'priority');

      expect(sortedTasks[0].priority).toBe(5);
      expect(sortedTasks[1].priority).toBe(1);
    });

    it('should sort tasks by time', () => {
      const sortedTasks = taskService.sortTasks(mockTasks, 'time');

      expect(sortedTasks[0].startTime.getTime()).toBeLessThan(sortedTasks[1].startTime.getTime());
    });

    it('should get task statistics', () => {
      mockTaskStore.getState.mockReturnValue({
        ...mockTaskStore.getState(),
        tasks: mockTasks,
      });

      const stats = taskService.getTaskStatistics();

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.upcoming).toBe(1);
      expect(stats.completionRate).toBe(50);
    });
  });

  describe('Data Management', () => {
    it('should export tasks', async () => {
      const mockBackupData = {
        tasks: [],
        timelineEvents: [],
        settings: {},
        exportedAt: new Date(),
        version: '1.0.0',
      };

      mockStorageService.exportData.mockResolvedValue(mockBackupData);

      const result = await taskService.exportTasks();

      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(mockBackupData);
    });

    it('should import tasks', async () => {
      const mockBackupData = {
        tasks: [
          {
            id: '1',
            title: 'Imported Task',
            description: 'Task from import',
            startTime: new Date(),
            endTime: new Date(),
            status: TimelineStatus.UPCOMING,
            priority: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        timelineEvents: [],
        settings: {},
        exportedAt: new Date(),
        version: '1.0.0',
      };

      const jsonData = JSON.stringify(mockBackupData);
      mockStorageService.loadTasks.mockResolvedValue(mockBackupData.tasks);

      const result = await taskService.importTasks(jsonData);

      expect(result).toBe(true);
      expect(mockStorageService.importData).toHaveBeenCalledWith(mockBackupData);
      expect(mockTaskStore.getState().setTasks).toHaveBeenCalledWith(mockBackupData.tasks);
    });

    it('should handle import failure', async () => {
      const invalidJsonData = 'invalid json';

      const result = await taskService.importTasks(invalidJsonData);

      expect(result).toBe(false);
      expect(mockUIStore.getState().addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Import Failed',
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old tasks', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

      const mockTasks = [
        {
          id: '1',
          title: 'Old Task',
          description: 'Old completed task',
          startTime: oldDate,
          endTime: oldDate,
          status: TimelineStatus.COMPLETED,
          priority: 3,
          createdAt: oldDate,
          updatedAt: oldDate,
        },
        {
          id: '2',
          title: 'Recent Task',
          description: 'Recent task',
          startTime: new Date(),
          endTime: new Date(),
          status: TimelineStatus.COMPLETED,
          priority: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTaskStore.getState.mockReturnValue({
        ...mockTaskStore.getState(),
        tasks: mockTasks,
      });

      const result = await taskService.cleanupOldTasks(30);

      expect(result).toBe(1);
      expect(mockStorageService.deleteTask).toHaveBeenCalledWith('1');
      expect(mockTaskStore.getState().removeTask).toHaveBeenCalledWith('1');
    });
  });
});