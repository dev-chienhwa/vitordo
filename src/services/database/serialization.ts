import { Task, TimelineEvent } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';

// Serialization utilities for database operations
export class SerializationUtils {
  // Task serialization
  public static serializeTask(task: Task): any {
    return {
      ...task,
      startTime: task.startTime.toISOString(),
      endTime: task.endTime.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  public static deserializeTask(data: any): Task {
    return {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  public static serializeTasks(tasks: Task[]): any[] {
    return tasks.map(task => this.serializeTask(task));
  }

  public static deserializeTasks(data: any[]): Task[] {
    return data.map(item => this.deserializeTask(item));
  }

  // Timeline event serialization
  public static serializeTimelineEvent(event: TimelineEvent): any {
    return {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
  }

  public static deserializeTimelineEvent(data: any): TimelineEvent {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
    };
  }

  public static serializeTimelineEvents(events: TimelineEvent[]): any[] {
    return events.map(event => this.serializeTimelineEvent(event));
  }

  public static deserializeTimelineEvents(data: any[]): TimelineEvent[] {
    return data.map(item => this.deserializeTimelineEvent(item));
  }

  // Generic JSON serialization with date handling
  public static toJSON(obj: any): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'SerializationUtils.toJSON');
      throw new Error('Failed to serialize object to JSON');
    }
  }

  public static fromJSON(json: string): any {
    try {
      return JSON.parse(json, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'SerializationUtils.fromJSON');
      throw new Error('Failed to deserialize JSON');
    }
  }

  // Validate serialized data
  public static validateTaskData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.id || typeof data.id !== 'string') {
      errors.push('Task ID is required and must be a string');
    }

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Task title is required and must be a string');
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Task description is required and must be a string');
    }

    if (!data.startTime) {
      errors.push('Task start time is required');
    } else {
      const startTime = new Date(data.startTime);
      if (isNaN(startTime.getTime())) {
        errors.push('Task start time must be a valid date');
      }
    }

    if (!data.endTime) {
      errors.push('Task end time is required');
    } else {
      const endTime = new Date(data.endTime);
      if (isNaN(endTime.getTime())) {
        errors.push('Task end time must be a valid date');
      }
    }

    if (data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      if (startTime >= endTime) {
        errors.push('Task end time must be after start time');
      }
    }

    if (data.priority !== undefined) {
      if (typeof data.priority !== 'number' || data.priority < 1 || data.priority > 5) {
        errors.push('Task priority must be a number between 1 and 5');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public static validateTimelineEventData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.id || typeof data.id !== 'string') {
      errors.push('Timeline event ID is required and must be a string');
    }

    if (!data.taskId || typeof data.taskId !== 'string') {
      errors.push('Timeline event task ID is required and must be a string');
    }

    if (!data.timestamp) {
      errors.push('Timeline event timestamp is required');
    } else {
      const timestamp = new Date(data.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Timeline event timestamp must be a valid date');
      }
    }

    if (!data.content || typeof data.content !== 'string') {
      errors.push('Timeline event content is required and must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Data compression utilities (for large datasets)
  public static compressData(data: any): string {
    try {
      const jsonString = this.toJSON(data);
      
      // Simple compression using base64 encoding
      // In a real application, you might want to use a proper compression library
      return btoa(jsonString);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'SerializationUtils.compressData');
      throw new Error('Failed to compress data');
    }
  }

  public static decompressData(compressedData: string): any {
    try {
      const jsonString = atob(compressedData);
      return this.fromJSON(jsonString);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'SerializationUtils.decompressData');
      throw new Error('Failed to decompress data');
    }
  }

  // Data sanitization
  public static sanitizeTaskData(data: any): Task {
    const sanitized = {
      id: String(data.id || '').trim(),
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      status: data.status,
      priority: Math.max(1, Math.min(5, Number(data.priority) || 1)),
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      metadata: data.metadata || {},
    };

    // Validate dates
    if (isNaN(sanitized.startTime.getTime())) {
      sanitized.startTime = new Date();
    }
    if (isNaN(sanitized.endTime.getTime())) {
      sanitized.endTime = new Date(sanitized.startTime.getTime() + 30 * 60 * 1000); // 30 minutes later
    }
    if (isNaN(sanitized.createdAt.getTime())) {
      sanitized.createdAt = new Date();
    }
    if (isNaN(sanitized.updatedAt.getTime())) {
      sanitized.updatedAt = new Date();
    }

    return sanitized as Task;
  }

  public static sanitizeTimelineEventData(data: any): TimelineEvent {
    const sanitized = {
      id: String(data.id || '').trim(),
      taskId: String(data.taskId || '').trim(),
      timestamp: new Date(data.timestamp),
      status: data.status,
      content: String(data.content || '').trim(),
      timeRange: data.timeRange || undefined,
    };

    // Validate timestamp
    if (isNaN(sanitized.timestamp.getTime())) {
      sanitized.timestamp = new Date();
    }

    return sanitized as TimelineEvent;
  }
}