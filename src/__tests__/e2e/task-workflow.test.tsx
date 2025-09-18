import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@/test-utils';
import { MainContainer } from '@/components/layout/main-container';
import { setupTestEnvironment, cleanupTestEnvironment, mockFetch } from '@/test-utils';
import { TimelineStatus } from '@/types/task';

// Mock all external services
jest.mock('@/services/llmService');
jest.mock('@/services/storageService');
jest.mock('@/services/taskService');

describe('End-to-End Task Workflow', () => {
  beforeEach(() => {
    setupTestEnvironment();
    
    // Mock successful API responses
    mockFetch({
      success: true,
      tasks: [
        {
          id: 'task-1',
          title: 'Review project proposal',
          description: 'Review the Q4 project proposal and provide feedback',
          startTime: new Date('2024-01-15T10:00:00').toISOString(),
          endTime: new Date('2024-01-15T11:00:00').toISOString(),
          status: TimelineStatus.UPCOMING,
          priority: 4,
          createdAt: new Date('2024-01-14T09:00:00').toISOString(),
          updatedAt: new Date('2024-01-14T09:00:00').toISOString(),
        },
      ],
      confidence: 0.9,
    });
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Complete Task Creation Workflow', () => {
    it('should create a task from user input', async () => {
      // Render the main application
      render(<MainContainer />);

      // Find the input field
      const input = screen.getByPlaceholderText(/describe your tasks/i);
      expect(input).toBeInTheDocument();

      // Enter task description
      fireEvent.change(input, { 
        target: { value: 'Review project proposal tomorrow at 10 AM' } 
      });

      // Submit the task
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Wait for task to appear in timeline
      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify task details
      expect(screen.getByText(/review the q4 project proposal/i)).toBeInTheDocument();
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
      expect(screen.getByText(/11:00/)).toBeInTheDocument();
    });

    it('should handle input validation errors', async () => {
      render(<MainContainer />);

      const input = screen.getByPlaceholderText(/describe your tasks/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Try to submit empty input
      fireEvent.click(submitButton);

      // Should not submit
      expect(screen.queryByText('Review project proposal')).not.toBeInTheDocument();

      // Try with very long input
      const longInput = 'a'.repeat(1000);
      fireEvent.change(input, { target: { value: longInput } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/too long/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during task creation', async () => {
      render(<MainContainer />);

      const input = screen.getByPlaceholderText(/describe your tasks/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'Create a task' } });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Task Status Update Workflow', () => {
    it('should update task status through quick update', async () => {
      render(<MainContainer />);

      // Wait for initial tasks to load
      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      });

      // Find and click quick status update
      const quickUpdateButton = screen.getByText(/quick status update/i);
      fireEvent.click(quickUpdateButton);

      // Enter status update
      const statusInput = screen.getByPlaceholderText(/update task status/i);
      fireEvent.change(statusInput, { 
        target: { value: 'I finished reviewing the project proposal' } 
      });

      // Submit status update
      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Wait for status to update
      await waitFor(() => {
        expect(screen.getByText(/recently completed/i)).toBeInTheDocument();
      });
    });

    it('should update task status through task actions menu', async () => {
      render(<MainContainer />);

      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      });

      // Find task and open actions menu
      const taskElement = screen.getByText('Review project proposal');
      const taskContainer = taskElement.closest('[data-testid="timeline-event"]');
      
      if (taskContainer) {
        const moreButton = within(taskContainer).getByRole('button', { name: /more/i });
        fireEvent.click(moreButton);

        // Click mark as completed
        const completeButton = screen.getByText(/mark as completed/i);
        fireEvent.click(completeButton);

        // Wait for status update
        await waitFor(() => {
          expect(screen.getByText(/recently completed/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Timeline Interaction Workflow', () => {
    it('should filter tasks by status', async () => {
      render(<MainContainer />);

      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);

      // Select completed tasks only
      const completedFilter = screen.getByLabelText(/completed/i);
      fireEvent.click(completedFilter);

      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      // Should show only completed tasks
      await waitFor(() => {
        const upcomingTasks = screen.queryAllByText(/upcoming/i);
        expect(upcomingTasks).toHaveLength(0);
      });
    });

    it('should search tasks', async () => {
      render(<MainContainer />);

      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      fireEvent.change(searchInput, { target: { value: 'project' } });

      // Should show matching tasks
      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      });

      // Search for non-existent task
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.queryByText('Review project proposal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch({ error: 'API rate limit exceeded' }, false);

      render(<MainContainer />);

      const input = screen.getByPlaceholderText(/describe your tasks/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'Create a task' } });
      fireEvent.click(submitButton);

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/api rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Mock network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      render(<MainContainer />);

      const input = screen.getByPlaceholderText(/describe your tasks/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'Create a task' } });
      fireEvent.click(submitButton);

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should show offline indicator when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      render(<MainContainer />);

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Workflow', () => {
    it('should support keyboard navigation', async () => {
      render(<MainContainer />);

      await waitFor(() => {
        expect(screen.getByText('Review project proposal')).toBeInTheDocument();
      });

      // Tab through interface
      const input = screen.getByPlaceholderText(/describe your tasks/i);
      input.focus();

      fireEvent.keyDown(input, { key: 'Tab' });

      // Should focus on submit button
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toHaveFocus();

      // Continue tabbing to timeline
      fireEvent.keyDown(submitButton, { key: 'Tab' });

      // Should focus on first task
      const firstTask = screen.getByText('Review project proposal');
      expect(firstTask.closest('[tabindex]')).toHaveFocus();
    });

    it('should support screen reader announcements', async () => {
      render(<MainContainer />);

      const input = screen.getByPlaceholderText(/describe your tasks/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(input, { target: { value: 'Create a task' } });
      fireEvent.click(submitButton);

      // Should have aria-live regions for status updates
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance Workflow', () => {
    it('should handle large number of tasks efficiently', async () => {
      // Mock large dataset
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        startTime: new Date(Date.now() + i * 60000).toISOString(),
        endTime: new Date(Date.now() + (i + 1) * 60000).toISOString(),
        status: TimelineStatus.UPCOMING,
        priority: (i % 5) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockFetch({ success: true, tasks: largeTasks });

      const startTime = performance.now();
      render(<MainContainer />);

      await waitFor(() => {
        expect(screen.getByText('Task 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
    });

    it('should debounce search input', async () => {
      render(<MainContainer />);

      const searchInput = screen.getByPlaceholderText(/search tasks/i);

      // Type quickly
      fireEvent.change(searchInput, { target: { value: 'p' } });
      fireEvent.change(searchInput, { target: { value: 'pr' } });
      fireEvent.change(searchInput, { target: { value: 'pro' } });
      fireEvent.change(searchInput, { target: { value: 'proj' } });

      // Should debounce and only search after delay
      await waitFor(() => {
        expect(searchInput).toHaveValue('proj');
      });

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should perform search
      expect(screen.getByText('Review project proposal')).toBeInTheDocument();
    });
  });
});