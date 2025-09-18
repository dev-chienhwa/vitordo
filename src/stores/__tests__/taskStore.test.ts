import { useTaskStore } from '../taskStore';
import { TimelineStatus } from '@/types/task';
import { act, renderHook } from '@testing-library/react';

// Mock the persistence middleware
jest.mock('../middleware/persistence', () => ({
  createPersistenceMiddleware: () => (fn: any) => fn,
  taskStorePersistConfig: {},
}));

describe('TaskStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useTaskStore.getState().clearTasks();
      useTaskStore.getState().setCurrentInput('');
      useTaskStore.getState().setLoading(false);
      useTaskStore.getState().setError(null);
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTaskStore());
    
    expect(result.current.tasks).toEqual([]);
    expect(result.current.currentInput).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should add a task', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const newTask = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      startTime: new Date(),
      endTime: new Date(),
      status: TimelineStatus.UPCOMING,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addTask(newTask);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toEqual(newTask);
  });

  it('should update task status', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const newTask = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      startTime: new Date(),
      endTime: new Date(),
      status: TimelineStatus.UPCOMING,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addTask(newTask);
    });

    act(() => {
      result.current.updateTaskStatus('1', TimelineStatus.COMPLETED);
    });

    expect(result.current.tasks[0].status).toBe(TimelineStatus.COMPLETED);
  });

  it('should remove a task', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const newTask = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      startTime: new Date(),
      endTime: new Date(),
      status: TimelineStatus.UPCOMING,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addTask(newTask);
    });

    expect(result.current.tasks).toHaveLength(1);

    act(() => {
      result.current.removeTask('1');
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  it('should filter tasks by status', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const tasks = [
      {
        id: '1',
        title: 'Completed Task',
        description: 'Description',
        startTime: new Date(),
        endTime: new Date(),
        status: TimelineStatus.COMPLETED,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Upcoming Task',
        description: 'Description',
        startTime: new Date(),
        endTime: new Date(),
        status: TimelineStatus.UPCOMING,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      result.current.addTasks(tasks);
    });

    expect(result.current.completedTasks).toHaveLength(1);
    expect(result.current.upcomingTasks).toHaveLength(1);
    expect(result.current.completedTasks[0].id).toBe('1');
    expect(result.current.upcomingTasks[0].id).toBe('2');
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
  });
});