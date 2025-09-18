import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Task, TimelineStatus } from '@/types/task';
import { STORAGE_KEYS } from '@/utils/constants';
import { createPersistenceMiddleware, taskStorePersistConfig } from './middleware/persistence';

export interface TaskState {
  // State
  tasks: Task[];
  currentInput: string;
  isLoading: boolean;
  error: string | null;
  selectedTaskId: string | null;
  
  // Computed getters
  completedTasks: Task[];
  recentlyCompletedTasks: Task[];
  upcomingTasks: Task[];
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  addTasks: (tasks: Task[]) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TimelineStatus) => void;
  removeTask: (taskId: string) => void;
  clearTasks: () => void;
  
  setCurrentInput: (input: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  
  // Utility actions
  getTaskById: (taskId: string) => Task | undefined;
  getTasksByStatus: (status: TimelineStatus) => Task[];
  getTasksByDateRange: (startDate: Date, endDate: Date) => Task[];
  sortTasksByTime: (tasks: Task[]) => Task[];
}

// Helper function to sort tasks by start time
const sortTasksByTime = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

// Helper function to filter tasks by status
const filterTasksByStatus = (tasks: Task[], status: TimelineStatus): Task[] => {
  return tasks.filter(task => task.status === status);
};

export const useTaskStore = create<TaskState>()(
  subscribeWithSelector(
    createPersistenceMiddleware(taskStorePersistConfig)(
      (set, get) => ({
    // Initial state
    tasks: [],
    currentInput: '',
    isLoading: false,
    error: null,
    selectedTaskId: null,
    
    // Computed getters
    get completedTasks() {
      return sortTasksByTime(filterTasksByStatus(get().tasks, TimelineStatus.COMPLETED));
    },
    
    get recentlyCompletedTasks() {
      return sortTasksByTime(filterTasksByStatus(get().tasks, TimelineStatus.RECENTLY_COMPLETED));
    },
    
    get upcomingTasks() {
      return sortTasksByTime(filterTasksByStatus(get().tasks, TimelineStatus.UPCOMING));
    },
    
    // Actions
    setTasks: (tasks) => set({ tasks }),
    
    addTask: (task) => set((state) => ({
      tasks: [...state.tasks, task]
    })),
    
    addTasks: (newTasks) => set((state) => ({
      tasks: [...state.tasks, ...newTasks]
    })),
    
    updateTask: (taskId, updates) => set((state) => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    })),
    
    updateTaskStatus: (taskId, status) => set((state) => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, status, updatedAt: new Date() }
          : task
      )
    })),
    
    removeTask: (taskId) => set((state) => ({
      tasks: state.tasks.filter(task => task.id !== taskId),
      selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId
    })),
    
    clearTasks: () => set({
      tasks: [],
      selectedTaskId: null
    }),
    
    setCurrentInput: (input) => set({ currentInput: input }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
    
    // Utility actions
    getTaskById: (taskId) => {
      return get().tasks.find(task => task.id === taskId);
    },
    
    getTasksByStatus: (status) => {
      return sortTasksByTime(filterTasksByStatus(get().tasks, status));
    },
    
    getTasksByDateRange: (startDate, endDate) => {
      return get().tasks.filter(task => 
        task.startTime >= startDate && task.endTime <= endDate
      );
    },
    
    sortTasksByTime: (tasks) => sortTasksByTime(tasks),
      })
    )
  )
);

// Selectors for better performance
export const selectTasks = (state: TaskState) => state.tasks;
export const selectCompletedTasks = (state: TaskState) => state.completedTasks;
export const selectRecentlyCompletedTasks = (state: TaskState) => state.recentlyCompletedTasks;
export const selectUpcomingTasks = (state: TaskState) => state.upcomingTasks;
export const selectCurrentInput = (state: TaskState) => state.currentInput;
export const selectIsLoading = (state: TaskState) => state.isLoading;
export const selectError = (state: TaskState) => state.error;
export const selectSelectedTaskId = (state: TaskState) => state.selectedTaskId;