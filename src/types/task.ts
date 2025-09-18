// Task-related type definitions

export enum TimelineStatus {
  COMPLETED = 'completed',
  RECENTLY_COMPLETED = 'recently_completed',
  UPCOMING = 'upcoming',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: TimelineStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    originalInput?: string;
    llmResponse?: string;
    estimatedDuration?: number;
  };
}

export interface TimelineEvent {
  id: string;
  taskId: string;
  timestamp: Date;
  status: TimelineStatus;
  content: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface TaskUpdate {
  taskId: string;
  newStatus: TimelineStatus;
  reason: string;
  timestamp: Date;
}