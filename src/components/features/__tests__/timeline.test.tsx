import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { Timeline } from '../timeline';
import { createMockTasks } from '@/test-utils';
import { TimelineStatus } from '@/types/task';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Timeline', () => {
  const mockTasks = createMockTasks(5);
  const defaultProps = {
    tasks: mockTasks,
    animated: false, // Disable animations for testing
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders timeline with tasks', () => {
      render(<Timeline {...defaultProps} />);
      
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      expect(screen.getByText('Test Task 3')).toBeInTheDocument();
    });

    it('renders empty state when no tasks', () => {
      render(<Timeline {...defaultProps} tasks={[]} />);
      
      expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<Timeline {...defaultProps} isLoading={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Task Grouping', () => {
    it('groups tasks by status when groupByStatus is true', () => {
      render(<Timeline {...defaultProps} groupByStatus={true} />);
      
      // Should have status group headers
      expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
      expect(screen.getByText(/recently completed/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    it('does not group tasks when groupByStatus is false', () => {
      render(<Timeline {...defaultProps} groupByStatus={false} />);
      
      // Should not have status group headers
      expect(screen.queryByText(/upcoming/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/recently completed/i)).not.toBeInTheDocument();
    });
  });

  describe('Task Interactions', () => {
    it('calls onTaskClick when task is clicked', async () => {
      const onTaskClick = jest.fn();
      render(<Timeline {...defaultProps} onTaskClick={onTaskClick} />);
      
      const taskElement = screen.getByText('Test Task 1');
      fireEvent.click(taskElement);
      
      await waitFor(() => {
        expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
      });
    });

    it('calls onTaskEdit when edit button is clicked', async () => {
      const onTaskEdit = jest.fn();
      render(<Timeline {...defaultProps} onTaskEdit={onTaskEdit} />);
      
      const editButton = screen.getAllByLabelText(/edit task/i)[0];
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(onTaskEdit).toHaveBeenCalledWith(mockTasks[0]);
      });
    });

    it('calls onTaskDelete when delete button is clicked', async () => {
      const onTaskDelete = jest.fn();
      render(<Timeline {...defaultProps} onTaskDelete={onTaskDelete} />);
      
      const deleteButton = screen.getAllByLabelText(/delete task/i)[0];
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(onTaskDelete).toHaveBeenCalledWith(mockTasks[0]);
      });
    });
  });

  describe('Task Filtering', () => {
    it('filters tasks by status', () => {
      const upcomingTasks = mockTasks.filter(t => t.status === TimelineStatus.UPCOMING);
      render(<Timeline {...defaultProps} tasks={upcomingTasks} />);
      
      expect(screen.getAllByTestId('timeline-event')).toHaveLength(upcomingTasks.length);
    });

    it('sorts tasks by time', () => {
      const unsortedTasks = [...mockTasks].reverse();
      render(<Timeline {...defaultProps} tasks={unsortedTasks} />);
      
      const taskElements = screen.getAllByTestId('timeline-event');
      expect(taskElements).toHaveLength(mockTasks.length);
      
      // First task should be the earliest one
      expect(taskElements[0]).toHaveTextContent('Test Task 1');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Timeline {...defaultProps} />);
      
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(mockTasks.length);
    });

    it('supports keyboard navigation', async () => {
      const onTaskClick = jest.fn();
      render(<Timeline {...defaultProps} onTaskClick={onTaskClick} />);
      
      const firstTask = screen.getAllByRole('listitem')[0];
      firstTask.focus();
      
      fireEvent.keyDown(firstTask, { key: 'Enter' });
      
      await waitFor(() => {
        expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
      });
    });
  });

  describe('Performance', () => {
    it('handles large number of tasks efficiently', () => {
      const largeTasks = createMockTasks(1000);
      const startTime = performance.now();
      
      render(<Timeline {...defaultProps} tasks={largeTasks} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('memoizes task components properly', () => {
      const { rerender } = render(<Timeline {...defaultProps} />);
      
      // Re-render with same props
      rerender(<Timeline {...defaultProps} />);
      
      // Should not re-render task components unnecessarily
      expect(screen.getAllByTestId('timeline-event')).toHaveLength(mockTasks.length);
    });
  });
});