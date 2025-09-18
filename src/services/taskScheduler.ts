import { Task, TimelineStatus } from '@/types/task';
import { TIME_CONFIG } from '@/utils/constants';
import { addMinutes, addHours, isSameDay, getTimeDifference } from '@/utils/time';
import { ErrorHandler } from '@/utils/error-handler';

export interface SchedulingOptions {
  workingHours?: {
    start: number; // 24-hour format
    end: number;   // 24-hour format
  };
  breakDuration?: number; // minutes between tasks
  maxTasksPerDay?: number;
  respectWeekends?: boolean;
  timeSlotDuration?: number; // minutes
}

export interface SchedulingConflict {
  task1: Task;
  task2: Task;
  overlapMinutes: number;
  severity: 'minor' | 'major' | 'critical';
}

export interface SchedulingSuggestion {
  type: 'reschedule' | 'split' | 'prioritize' | 'defer';
  task: Task;
  suggestedTime?: {
    startTime: Date;
    endTime: Date;
  };
  reason: string;
}

export class TaskScheduler {
  private options: SchedulingOptions;

  constructor(options: SchedulingOptions = {}) {
    this.options = {
      workingHours: TIME_CONFIG.workingHours,
      breakDuration: 5,
      maxTasksPerDay: 20,
      respectWeekends: true,
      timeSlotDuration: TIME_CONFIG.timeSlotInterval,
      ...options,
    };
  }

  // Auto-schedule tasks based on priority and constraints
  public autoScheduleTasks(tasks: Task[], startDate: Date = new Date()): Task[] {
    try {
      // Sort tasks by priority and creation time
      const sortedTasks = [...tasks].sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.createdAt.getTime() - b.createdAt.getTime(); // Earlier created first
      });

      const scheduledTasks: Task[] = [];
      let currentScheduleTime = this.getNextAvailableSlot(startDate);

      for (const task of sortedTasks) {
        // Skip already scheduled tasks
        if (task.status !== TimelineStatus.UPCOMING) {
          scheduledTasks.push(task);
          continue;
        }

        const duration = this.getTaskDuration(task);
        const scheduledTask = this.scheduleTask(task, currentScheduleTime, duration);
        
        scheduledTasks.push(scheduledTask);
        
        // Update next available time
        currentScheduleTime = addMinutes(scheduledTask.endTime, this.options.breakDuration || 5);
        currentScheduleTime = this.getNextAvailableSlot(currentScheduleTime);
      }

      return scheduledTasks;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskScheduler.autoScheduleTasks');
      return tasks; // Return original tasks if scheduling fails
    }
  }

  // Find scheduling conflicts between tasks
  public findConflicts(tasks: Task[]): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const task1 = tasks[i];
        const task2 = tasks[j];
        
        const overlap = this.getTimeOverlap(task1, task2);
        if (overlap > 0) {
          conflicts.push({
            task1,
            task2,
            overlapMinutes: overlap,
            severity: this.getConflictSeverity(overlap),
          });
        }
      }
    }

    return conflicts.sort((a, b) => b.overlapMinutes - a.overlapMinutes);
  }

  // Generate scheduling suggestions
  public generateSuggestions(tasks: Task[]): SchedulingSuggestion[] {
    const suggestions: SchedulingSuggestion[] = [];
    const conflicts = this.findConflicts(tasks);
    
    // Handle conflicts
    for (const conflict of conflicts) {
      const suggestion = this.resolveConflict(conflict);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Check for overloaded days
    const dailyTasks = this.groupTasksByDay(tasks);
    for (const [date, dayTasks] of dailyTasks.entries()) {
      if (dayTasks.length > (this.options.maxTasksPerDay || 20)) {
        const suggestion = this.handleOverloadedDay(date, dayTasks);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Check for tasks outside working hours
    for (const task of tasks) {
      if (!this.isWithinWorkingHours(task.startTime) || !this.isWithinWorkingHours(task.endTime)) {
        const suggestion = this.rescheduleToWorkingHours(task);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  // Optimize task order based on priority and dependencies
  public optimizeTaskOrder(tasks: Task[]): Task[] {
    try {
      // Group tasks by day
      const dailyTasks = this.groupTasksByDay(tasks);
      const optimizedTasks: Task[] = [];

      for (const [date, dayTasks] of dailyTasks.entries()) {
        // Sort by priority and estimated energy requirement
        const sortedDayTasks = dayTasks.sort((a, b) => {
          // High priority tasks in the morning
          if (a.priority !== b.priority) {
            const aScore = this.getTaskScore(a);
            const bScore = this.getTaskScore(b);
            return bScore - aScore;
          }
          
          return a.startTime.getTime() - b.startTime.getTime();
        });

        optimizedTasks.push(...sortedDayTasks);
      }

      return optimizedTasks;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskScheduler.optimizeTaskOrder');
      return tasks;
    }
  }

  // Get available time slots for a given day
  public getAvailableSlots(date: Date, existingTasks: Task[] = []): Array<{ start: Date; end: Date; duration: number }> {
    const slots: Array<{ start: Date; end: Date; duration: number }> = [];
    
    // Get working hours for the day
    const dayStart = new Date(date);
    dayStart.setHours(this.options.workingHours?.start || 9, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(this.options.workingHours?.end || 17, 0, 0, 0);

    // Get tasks for this day
    const dayTasks = existingTasks
      .filter(task => isSameDay(task.startTime, date))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let currentTime = dayStart;

    for (const task of dayTasks) {
      // Add slot before this task if there's time
      if (task.startTime > currentTime) {
        const duration = getTimeDifference(currentTime, task.startTime).totalMinutes;
        if (duration >= (this.options.timeSlotDuration || 15)) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(task.startTime),
            duration,
          });
        }
      }
      
      currentTime = new Date(Math.max(currentTime.getTime(), task.endTime.getTime()));
    }

    // Add final slot if there's time left in the day
    if (currentTime < dayEnd) {
      const duration = getTimeDifference(currentTime, dayEnd).totalMinutes;
      if (duration >= (this.options.timeSlotDuration || 15)) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(dayEnd),
          duration,
        });
      }
    }

    return slots;
  }

  // Private helper methods
  private scheduleTask(task: Task, startTime: Date, duration: number): Task {
    const endTime = addMinutes(startTime, duration);
    
    return {
      ...task,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      updatedAt: new Date(),
    };
  }

  private getTaskDuration(task: Task): number {
    if (task.metadata?.estimatedDuration) {
      return task.metadata.estimatedDuration;
    }
    
    const currentDuration = getTimeDifference(task.startTime, task.endTime).totalMinutes;
    return currentDuration > 0 ? currentDuration : TIME_CONFIG.defaultTaskDuration;
  }

  private getNextAvailableSlot(fromTime: Date): Date {
    let nextSlot = new Date(fromTime);
    
    // Skip weekends if configured
    if (this.options.respectWeekends) {
      while (nextSlot.getDay() === 0 || nextSlot.getDay() === 6) {
        nextSlot = addHours(nextSlot, 24);
        nextSlot.setHours(this.options.workingHours?.start || 9, 0, 0, 0);
      }
    }

    // Ensure within working hours
    const workStart = this.options.workingHours?.start || 9;
    const workEnd = this.options.workingHours?.end || 17;
    
    if (nextSlot.getHours() < workStart) {
      nextSlot.setHours(workStart, 0, 0, 0);
    } else if (nextSlot.getHours() >= workEnd) {
      nextSlot = addHours(nextSlot, 24);
      nextSlot.setHours(workStart, 0, 0, 0);
      return this.getNextAvailableSlot(nextSlot);
    }

    return nextSlot;
  }

  private getTimeOverlap(task1: Task, task2: Task): number {
    const start1 = task1.startTime.getTime();
    const end1 = task1.endTime.getTime();
    const start2 = task2.startTime.getTime();
    const end2 = task2.endTime.getTime();

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    return overlapEnd > overlapStart ? (overlapEnd - overlapStart) / (1000 * 60) : 0;
  }

  private getConflictSeverity(overlapMinutes: number): 'minor' | 'major' | 'critical' {
    if (overlapMinutes <= 15) return 'minor';
    if (overlapMinutes <= 60) return 'major';
    return 'critical';
  }

  private resolveConflict(conflict: SchedulingConflict): SchedulingSuggestion | null {
    const { task1, task2, overlapMinutes } = conflict;
    
    // Prioritize higher priority task
    const taskToReschedule = task1.priority >= task2.priority ? task2 : task1;
    const duration = this.getTaskDuration(taskToReschedule);
    
    // Find next available slot
    const nextSlot = this.getNextAvailableSlot(taskToReschedule.endTime);
    
    return {
      type: 'reschedule',
      task: taskToReschedule,
      suggestedTime: {
        startTime: nextSlot,
        endTime: addMinutes(nextSlot, duration),
      },
      reason: `Conflicts with "${task1.id === taskToReschedule.id ? task2.title : task1.title}" (${overlapMinutes} min overlap)`,
    };
  }

  private handleOverloadedDay(date: string, tasks: Task[]): SchedulingSuggestion | null {
    // Find lowest priority task to defer
    const lowestPriorityTask = tasks.reduce((lowest, task) => 
      task.priority < lowest.priority ? task : lowest
    );

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextSlot = this.getNextAvailableSlot(nextDay);
    const duration = this.getTaskDuration(lowestPriorityTask);

    return {
      type: 'defer',
      task: lowestPriorityTask,
      suggestedTime: {
        startTime: nextSlot,
        endTime: addMinutes(nextSlot, duration),
      },
      reason: `Day is overloaded with ${tasks.length} tasks`,
    };
  }

  private rescheduleToWorkingHours(task: Task): SchedulingSuggestion | null {
    const nextSlot = this.getNextAvailableSlot(task.startTime);
    const duration = this.getTaskDuration(task);

    return {
      type: 'reschedule',
      task,
      suggestedTime: {
        startTime: nextSlot,
        endTime: addMinutes(nextSlot, duration),
      },
      reason: 'Task is scheduled outside working hours',
    };
  }

  private isWithinWorkingHours(time: Date): boolean {
    const hour = time.getHours();
    const workStart = this.options.workingHours?.start || 9;
    const workEnd = this.options.workingHours?.end || 17;
    
    return hour >= workStart && hour < workEnd;
  }

  private groupTasksByDay(tasks: Task[]): Map<string, Task[]> {
    const dailyTasks = new Map<string, Task[]>();
    
    for (const task of tasks) {
      const dateKey = task.startTime.toDateString();
      if (!dailyTasks.has(dateKey)) {
        dailyTasks.set(dateKey, []);
      }
      dailyTasks.get(dateKey)!.push(task);
    }

    return dailyTasks;
  }

  private getTaskScore(task: Task): number {
    // Score based on priority and time of day preference
    let score = task.priority * 10;
    
    // Prefer high-priority tasks in the morning
    const hour = task.startTime.getHours();
    if (hour >= 9 && hour <= 11) {
      score += 5; // Morning bonus
    } else if (hour >= 14 && hour <= 16) {
      score += 2; // Afternoon bonus
    }

    return score;
  }
}