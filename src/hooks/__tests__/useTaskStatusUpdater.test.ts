import { renderHook, act } from '@testing-library/react';
import { useTaskStatusUpdater } from '../useTaskStatusUpdater';
import { TimelineStatus } from '@/types/task';

// Mock dependencies
jest.mock('@/stores/taskStore');
jest.mock('@/stores/uiStore');
jest.mock('@/services/taskService');
jest.mock('@/utils/error-handler');

const mockTask = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'A test task',
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T11:00:00'),
  status: TimelineStatus.UPCOMING,
  priority: 3,
  createdAt: new Date('2024-01-14T09:00:00'),
  updatedAt: new Date('2024-01-14T09:00:00'),
};

const mockTaskStore = {
  getTaskById: jest.fn(),
  updateTaskStatus: jest.fn(),
  updateTask: jest.fn(),
  tasks: [mockTask],
  getState: jest.fn(() => ({
    getTaskById: jest.fn(() => mockTask),
    tasks: [mockTask],
  })),
};

const mockUIStore = {
  addNotification: jest.fn(),
  getState: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
};

const mockTaskService = {
  updateTaskStatus: jest.fn(),
};

// Mock the store hooks
jest.mock('@/stores/taskStore', () => ({
  useTaskStore: jest.fn(() => mockTaskStore),
}));

jest.mock('@/stores/uiStore', () => ({
  useUIStore: jest.fn(() => mockUIStore),
}));

jest.mock('@/services/taskService', () => ({
  taskService: mockTaskService,
}));

describe('useTaskStatusUpdater', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update single task status successfully', async () => {
    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.updateSingleTaskStatus(
        'test-task-1',
        TimelineStatus.RECENTLY_COMPLETED,
        'Task completed manually'
      );

      expect(response.success).toBe(true);
      expect(response.updatedTasks).toHaveLength(1);
    });

    expect(mockTaskStore.updateTaskStatus).toHaveBeenCalledWith(
      'test-task-1',
      TimelineStatus.RECENTLY_COMPLETED
    );
    expect(mockUIStore.addNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Task Updated',
      message: 'Test Task marked as recently completed',
      duration: 3000,
    });
  });

  it('should handle task not found error', async () => {
    mockTaskStore.getState.mockReturnValue({
      getTaskById: jest.fn(() => null),
      tasks: [],
    });

    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.updateSingleTaskStatus(
        'non-existent-task',
        TimelineStatus.RECENTLY_COMPLETED
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('Task not found');
    });
  });

  it('should update task status via natural language input', async () => {
    mockTaskService.updateTaskStatus.mockResolvedValue({
      success: true,
      updatedTasks: [{ ...mockTask, status: TimelineStatus.RECENTLY_COMPLETED }],
    });

    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.updateTaskStatusViaInput(
        'I finished the test task'
      );

      expect(response.success).toBe(true);
      expect(response.updatedTasks).toHaveLength(1);
    });

    expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
      'I finished the test task'
    );
  });

  it('should handle LLM service errors', async () => {
    mockTaskService.updateTaskStatus.mockResolvedValue({
      success: false,
      error: 'LLM service unavailable',
    });

    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.updateTaskStatusViaInput(
        'I finished the test task'
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('LLM service unavailable');
    });
  });

  it('should batch update multiple tasks', async () => {
    const updates = [
      { taskId: 'test-task-1', status: TimelineStatus.RECENTLY_COMPLETED, reason: 'Completed' },
      { taskId: 'test-task-2', status: TimelineStatus.COMPLETED, reason: 'Archived' },
    ];

    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.batchUpdateTaskStatus(updates);

      expect(response.success).toBe(true);
    });

    expect(mockTaskStore.updateTaskStatus).toHaveBeenCalledTimes(2);
    expect(mockUIStore.addNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Tasks Updated',
      message: '1 task(s) updated successfully',
      duration: 3000,
    });
  });

  it('should mark task as completed', async () => {
    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.markTaskCompleted(
        'test-task-1',
        'Task completed'
      );

      expect(response.success).toBe(true);
    });

    expect(mockTaskStore.updateTaskStatus).toHaveBeenCalledWith(
      'test-task-1',
      TimelineStatus.RECENTLY_COMPLETED
    );
  });

  it('should archive task', async () => {
    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.archiveTask(
        'test-task-1',
        'Task archived'
      );

      expect(response.success).toBe(true);
    });

    expect(mockTaskStore.updateTaskStatus).toHaveBeenCalledWith(
      'test-task-1',
      TimelineStatus.COMPLETED
    );
  });

  it('should auto-transition recently completed tasks', async () => {
    const oldTask = {
      ...mockTask,
      status: TimelineStatus.RECENTLY_COMPLETED,
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    };

    mockTaskStore.getState.mockReturnValue({
      getTaskById: jest.fn(() => oldTask),
      tasks: [oldTask],
    });

    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.autoTransitionTasks();

      expect(response.success).toBe(true);
      expect(response.updatedTasks).toHaveLength(1);
    });

    expect(mockTaskStore.updateTaskStatus).toHaveBeenCalledWith(
      'test-task-1',
      TimelineStatus.COMPLETED
    );
  });

  it('should not auto-transition recent tasks', async () => {
    const recentTask = {
      ...mockTask,
      status: TimelineStatus.RECENTLY_COMPLETED,
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    };

    mockTaskStore.getState.mockReturnValue({
      getTaskById: jest.fn(() => recentTask),
      tasks: [recentTask],
    });

    const { result } = renderHook(() => useTaskStatusUpdater());

    await act(async () => {
      const response = await result.current.autoTransitionTasks();

      expect(response.success).toBe(true);
      expect(response.updatedTasks).toHaveLength(0);
    });

    expect(mockTaskStore.updateTaskStatus).not.toHaveBeenCalled();
  });
});