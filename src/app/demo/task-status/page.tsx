'use client';

import React, { useState } from 'react';
import { Task, TimelineStatus } from '@/types/task';
import { TaskStatusTransition } from '@/components/features/task-status-transition';
import { TaskActionsMenu } from '@/components/features/task-actions-menu';
import { QuickStatusUpdate } from '@/components/features/quick-status-update';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TaskStatusDemo() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<TimelineStatus>(TimelineStatus.UPCOMING);
  const [showTransition, setShowTransition] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Sample tasks for demo
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Review project proposal',
      description: 'Review the Q4 project proposal and provide feedback',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T11:00:00'),
      status: TimelineStatus.UPCOMING,
      priority: 4,
      createdAt: new Date('2024-01-14T09:00:00'),
      updatedAt: new Date('2024-01-14T09:00:00'),
    },
    {
      id: 'task-2',
      title: 'Team standup meeting',
      description: 'Daily standup with the development team',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T09:30:00'),
      status: TimelineStatus.RECENTLY_COMPLETED,
      priority: 3,
      createdAt: new Date('2024-01-14T08:00:00'),
      updatedAt: new Date('2024-01-15T09:30:00'),
    },
    {
      id: 'task-3',
      title: 'Update documentation',
      description: 'Update the API documentation with recent changes',
      startTime: new Date('2024-01-14T14:00:00'),
      endTime: new Date('2024-01-14T16:00:00'),
      status: TimelineStatus.COMPLETED,
      priority: 2,
      createdAt: new Date('2024-01-13T10:00:00'),
      updatedAt: new Date('2024-01-14T16:00:00'),
    },
  ];

  const [tasks, setTasks] = useState(sampleTasks);

  const handleStatusTransition = (task: Task, status: TimelineStatus) => {
    setSelectedTask(task);
    setNewStatus(status);
    setShowTransition(true);
  };

  const handleTransitionComplete = (task: Task, newStatus: TimelineStatus) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id 
        ? { ...t, status: newStatus, updatedAt: new Date() }
        : t
    ));
    setShowTransition(false);
    setSelectedTask(null);
  };

  const getStatusColor = (status: TimelineStatus) => {
    switch (status) {
      case TimelineStatus.UPCOMING:
        return 'border-gray-300 bg-gray-50';
      case TimelineStatus.RECENTLY_COMPLETED:
        return 'border-green-300 bg-green-50';
      case TimelineStatus.COMPLETED:
        return 'border-gray-400 bg-gray-100';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Task Status Update Demo</h1>
        
        {/* Quick Status Update */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Status Update</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickStatusUpdate 
              onSuccess={() => {
                console.log('Status update successful');
              }}
            />
          </CardContent>
        </Card>

        {/* Status Transition Demo */}
        {showTransition && selectedTask && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Status Transition Animation</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <TaskStatusTransition
                task={selectedTask}
                newStatus={newStatus}
                onTransitionComplete={handleTransitionComplete}
                showAnimation={true}
                duration={2000}
              />
            </CardContent>
          </Card>
        )}

        {/* Task List with Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tasks.map((task) => (
            <Card key={task.id} className={`relative ${getStatusColor(task.status)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActionsMenu(showActionsMenu === task.id ? false : task.id)}
                      className="p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </Button>
                    
                    <TaskActionsMenu
                      task={task}
                      isOpen={showActionsMenu === task.id}
                      onClose={() => setShowActionsMenu(false)}
                      onEdit={(task) => console.log('Edit task:', task)}
                      onDelete={(task) => console.log('Delete task:', task)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Status:</span> {task.status.replace('_', ' ')}
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span> {task.priority}/5
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {task.startTime.toLocaleTimeString()} - {task.endTime.toLocaleTimeString()}
                  </div>
                </div>

                {/* Quick Status Change Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {task.status === TimelineStatus.UPCOMING && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusTransition(task, TimelineStatus.RECENTLY_COMPLETED)}
                      className="text-xs"
                    >
                      Mark Complete
                    </Button>
                  )}
                  
                  {task.status === TimelineStatus.RECENTLY_COMPLETED && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusTransition(task, TimelineStatus.COMPLETED)}
                        className="text-xs"
                      >
                        Archive
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusTransition(task, TimelineStatus.UPCOMING)}
                        className="text-xs"
                      >
                        Reopen
                      </Button>
                    </>
                  )}
                  
                  {task.status === TimelineStatus.COMPLETED && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusTransition(task, TimelineStatus.UPCOMING)}
                      className="text-xs"
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Task Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">
                  {tasks.length}
                </div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              
              <div className="text-center p-4 bg-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {tasks.filter(t => t.status === TimelineStatus.UPCOMING).length}
                </div>
                <div className="text-sm text-blue-600">Upcoming</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {tasks.filter(t => t.status === TimelineStatus.RECENTLY_COMPLETED).length}
                </div>
                <div className="text-sm text-green-600">Recently Completed</div>
              </div>
              
              <div className="text-center p-4 bg-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">
                  {tasks.filter(t => t.status === TimelineStatus.COMPLETED).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}