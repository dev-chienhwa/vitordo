// Validation utility functions

import { Task, TimelineStatus } from '@/types/task';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateTaskInput(input: string): {
  isValid: boolean;
  error?: string;
} {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  
  if (input.trim().length < 3) {
    return { isValid: false, error: 'Input must be at least 3 characters long' };
  }
  
  if (input.length > 1000) {
    return { isValid: false, error: 'Input cannot exceed 1000 characters' };
  }
  
  return { isValid: true };
}

export function validateTask(task: Partial<Task>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!task.title || task.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!task.description || task.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!task.startTime || !(task.startTime instanceof Date)) {
    errors.push('Valid start time is required');
  }
  
  if (!task.endTime || !(task.endTime instanceof Date)) {
    errors.push('Valid end time is required');
  }
  
  if (task.startTime && task.endTime && task.startTime >= task.endTime) {
    errors.push('End time must be after start time');
  }
  
  if (!Object.values(TimelineStatus).includes(task.status as TimelineStatus)) {
    errors.push('Valid status is required');
  }
  
  if (task.priority !== undefined && (task.priority < 1 || task.priority > 5)) {
    errors.push('Priority must be between 1 and 5');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function validateTimeRange(start: Date, end: Date): {
  isValid: boolean;
  error?: string;
} {
  if (start >= end) {
    return { isValid: false, error: 'End time must be after start time' };
  }
  
  const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (diffInHours > 24) {
    return { isValid: false, error: 'Task duration cannot exceed 24 hours' };
  }
  
  return { isValid: true };
}

export function isValidTimelineStatus(status: string): status is TimelineStatus {
  return Object.values(TimelineStatus).includes(status as TimelineStatus);
}

export function validateApiKey(apiKey: string): {
  isValid: boolean;
  error?: string;
} {
  if (!apiKey || apiKey.trim().length === 0) {
    return { isValid: false, error: 'API key is required' };
  }
  
  if (apiKey.length < 10) {
    return { isValid: false, error: 'API key appears to be too short' };
  }
  
  return { isValid: true };
}