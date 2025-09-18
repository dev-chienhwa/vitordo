'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Task } from '@/types/task';
import { LeftPanel } from './left-panel';
import { RightPanel } from './right-panel';
import { TimelineFilters, FilterState } from '@/components/features/timeline-filters';
import { NotificationSystem } from '@/components/ui/notification-system';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { taskService } from '@/services/taskService';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useIsMobile } from '@/hooks/useBreakpoint';

export interface MainContainerProps {
  className?: string;
  animated?: boolean;
}

export function MainContainer({
  className,
  animated = true,
}: MainContainerProps) {
  // State
  const [showFilters, setShowFilters] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [llmStatus, setLLMStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  // Store hooks
  const {
    tasks,
    isLoading,
    error,
    currentInput,
    setCurrentInput,
  } = useTaskStore();

  const {
    addNotification,
  } = useUIStore();

  // Network status and responsive state
  const isOnline = useOnlineStatus();
  const isMobile = useIsMobile();

  // Initialize filtered tasks
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  // Check LLM service status
  useEffect(() => {
    const checkLLMStatus = async () => {
      try {
        // This would be implemented when we have LLM service configured
        // const health = await LLMService.getInstance().healthCheck();
        // setLLMStatus(health.primary.healthy ? 'connected' : 'error');
        setLLMStatus('connected'); // Mock for now
      } catch (error) {
        setLLMStatus('error');
      }
    };

    if (isOnline) {
      checkLLMStatus();
    } else {
      setLLMStatus('disconnected');
    }
  }, [isOnline]);

  // Handle task submission
  const handleTaskSubmit = async (input: string) => {
    try {
      setCurrentInput(input);
      
      // Process the input through task service
      const result = await taskService.processUserInput(input);
      
      if (!result.success) {
        addNotification({
          type: 'error',
          title: 'Failed to Process Input',
          message: result.error || 'Unknown error occurred',
        });
        return;
      }

      // Success notification is handled by the task service
      setCurrentInput('');
    } catch (error) {
      console.error('Error processing task input:', error);
      addNotification({
        type: 'error',
        title: 'Processing Error',
        message: 'An unexpected error occurred while processing your input.',
      });
    }
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    // For now, just show a notification with task details
    addNotification({
      type: 'info',
      title: task.title,
      message: task.description,
      duration: 3000,
    });
  };

  // Handle task edit
  const handleTaskEdit = (task: Task) => {
    // For now, populate the input with the task title for editing
    setCurrentInput(`Edit task: ${task.title}`);
    
    addNotification({
      type: 'info',
      title: 'Edit Mode',
      message: 'Task details populated in input box for editing',
      duration: 3000,
    });
  };

  // Handle task delete
  const handleTaskDelete = (task: Task) => {
    // For now, just show a confirmation notification
    addNotification({
      type: 'warning',
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This feature will be implemented soon.`,
      duration: 5000,
    });
  };

  // Handle filter changes
  const handleFiltersChange = (filters: FilterState) => {
    let filtered = [...tasks];

    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    // Filter by priority
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.priority));
    }

    // Filter by date range
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(task => {
          const taskDate = task.startTime.toDateString();
          return taskDate === now.toDateString();
        });
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filtered = filtered.filter(task => 
          task.startTime >= weekStart && task.startTime <= weekEnd
        );
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        filtered = filtered.filter(task => 
          task.startTime >= monthStart && task.startTime <= monthEnd
        );
        break;
      case 'all':
      default:
        // No date filtering
        break;
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'time':
          comparison = a.startTime.getTime() - b.startTime.getTime();
          break;
        case 'priority':
          comparison = b.priority - a.priority; // Higher priority first
          break;
        case 'status':
          const statusOrder = { upcoming: 0, recently_completed: 1, completed: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredTasks(filtered);
  };

  // Handle quick actions
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'schedule-meeting':
        setCurrentInput('Schedule a team meeting for tomorrow at 2 PM');
        break;
      case 'quick-task':
        setCurrentInput('Add a quick 15-minute task');
        break;
      case 'time-block':
        setCurrentInput('Block 2 hours for focused work this afternoon');
        break;
      case 'view-analytics':
        addNotification({
          type: 'info',
          title: 'Analytics',
          message: 'Analytics view coming soon!',
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100',
      'flex flex-col lg:flex-row',
      className
    )}>
      {/* Left Panel */}
      <div className={cn(
        'w-full lg:w-1/2 min-w-0',
        'h-screen lg:h-auto',
        'flex-shrink-0'
      )}>
        <LeftPanel
          onTaskSubmit={handleTaskSubmit}
          isLoading={isLoading}
          animated={animated}
          llmStatus={llmStatus}
          onQuickAction={handleQuickAction}
          showStatusIndicator={true}
          showQuickActions={true}
          welcomeTitle="Input,"
          welcomeSubtitle="A'll be Scheduled!"
          inputPlaceholder="Describe your tasks in natural language..."
        />
      </div>

      {/* Right Panel */}
      <div className={cn(
        'w-full lg:w-1/2 min-w-0 relative',
        'h-screen lg:h-auto',
        'flex-shrink-0'
      )}>
        <RightPanel
          tasks={filteredTasks}
          animated={animated}
          isLoading={isLoading}
          onTaskClick={handleTaskClick}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onFilterClick={() => setShowFilters(!showFilters)}
          onOptionsClick={() => {
            addNotification({
              type: 'info',
              title: 'Options',
              message: 'Options menu coming soon!',
            });
          }}
          timelineTitle="Your Timeline"
          showFilters={true}
          showOptions={true}
          showQuickUpdate={true}
          groupByStatus={true}
        />

        {/* Timeline Filters */}
        <TimelineFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFiltersChange={handleFiltersChange}
          className="mx-4 lg:mx-6"
        />
      </div>

      {/* Notification System */}
      <NotificationSystem />

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-start">
              <div className="flex-1">
                <h4 className="text-sm font-medium">Error</h4>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => useTaskStore.getState().setError(null)}
                className="ml-3 text-red-400 hover:text-red-600 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Processing your request...</span>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">You're offline</span>
          </div>
        </div>
      )}
    </div>
  );
}