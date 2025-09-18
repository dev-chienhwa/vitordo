import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ErrorProvider } from '@/components/providers/error-provider';
import { Task, TimelineStatus } from '@/types/task';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      <ErrorProvider>
        {children}
      </ErrorProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task-1',
  title: 'Test Task',
  description: 'A test task for unit testing',
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T11:00:00'),
  status: TimelineStatus.UPCOMING,
  priority: 3,
  createdAt: new Date('2024-01-14T09:00:00'),
  updatedAt: new Date('2024-01-14T09:00:00'),
  ...overrides,
});

export const createMockTasks = (count: number = 3): Task[] => {
  return Array.from({ length: count }, (_, i) => createMockTask({
    id: `test-task-${i + 1}`,
    title: `Test Task ${i + 1}`,
    status: [TimelineStatus.UPCOMING, TimelineStatus.RECENTLY_COMPLETED, TimelineStatus.COMPLETED][i % 3],
    priority: (i % 5) + 1,
    startTime: new Date(Date.now() + i * 60 * 60 * 1000), // Each task 1 hour apart
    endTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
  }));
};

// Mock API responses
export const mockLLMResponse = {
  success: true,
  tasks: [createMockTask()],
  confidence: 0.9,
};

export const mockLLMErrorResponse = {
  success: false,
  error: 'Mock LLM error for testing',
};

// Mock store states
export const mockTaskStoreState = {
  tasks: createMockTasks(),
  isLoading: false,
  error: null,
  currentInput: '',
};

export const mockUIStoreState = {
  notifications: [],
  theme: 'light' as const,
  sidebarOpen: true,
};

// Test utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
};

export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock localStorage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  return localStorageMock;
};

// Mock fetch
export const mockFetch = (response: any, ok: boolean = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
};

// Performance mock
export const mockPerformance = () => {
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
    },
  });
};

// Animation frame mock
export const mockAnimationFrame = () => {
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
};

// Setup all common mocks
export const setupTestEnvironment = () => {
  mockIntersectionObserver();
  mockResizeObserver();
  mockMatchMedia();
  mockLocalStorage();
  mockPerformance();
  mockAnimationFrame();
};

// Cleanup function
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};