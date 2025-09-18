import { Task, TimelineStatus, TimelineEvent } from '@/types/task';
import { storageService } from './storageService';
import { ErrorHandler } from '@/utils/error-handler';
import { formatRelativeTime, getTimeDifference, isSameDay } from '@/utils/time';

export interface TaskAnalytics {
  productivity: ProductivityMetrics;
  patterns: TaskPatterns;
  performance: PerformanceMetrics;
  insights: TaskInsight[];
}

export interface ProductivityMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  totalTimeSpent: number;
  dailyAverage: number;
  weeklyTrend: number[];
}

export interface TaskPatterns {
  peakHours: { hour: number; taskCount: number }[];
  commonDurations: { duration: number; frequency: number }[];
  priorityDistribution: { priority: number; count: number; percentage: number }[];
  statusTransitions: { from: TimelineStatus; to: TimelineStatus; count: number }[];
}

export interface PerformanceMetrics {
  onTimeCompletion: number;
  averageDelay: number;
  overdueRate: number;
  estimationAccuracy: number;
  streakDays: number;
}

export interface TaskInsight {
  type: 'productivity' | 'pattern' | 'performance' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: any;
}

export class TaskAnalytics {
  private static instance: TaskAnalytics;

  private constructor() {}

  public static getInstance(): TaskAnalytics {
    if (!TaskAnalytics.instance) {
      TaskAnalytics.instance = new TaskAnalytics();
    }
    return TaskAnalytics.instance;
  }

  // Generate comprehensive analytics report
  public async generateReport(
    tasks: Task[],
    timelineEvents: TimelineEvent[] = [],
    dateRange?: { start: Date; end: Date }
  ): Promise<TaskAnalytics> {
    try {
      // Filter tasks by date range if provided
      const filteredTasks = dateRange 
        ? tasks.filter(task => 
            task.createdAt >= dateRange.start && task.createdAt <= dateRange.end
          )
        : tasks;

      const filteredEvents = dateRange
        ? timelineEvents.filter(event =>
            event.timestamp >= dateRange.start && event.timestamp <= dateRange.end
          )
        : timelineEvents;

      const [productivity, patterns, performance] = await Promise.all([
        this.calculateProductivityMetrics(filteredTasks),
        this.analyzeTaskPatterns(filteredTasks, filteredEvents),
        this.calculatePerformanceMetrics(filteredTasks),
      ]);

      const insights = this.generateInsights(productivity, patterns, performance, filteredTasks);

      return {
        productivity,
        patterns,
        performance,
        insights,
      };
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskAnalytics.generateReport');
      throw new Error('Failed to generate analytics report');
    }
  }

  // Calculate productivity metrics
  private async calculateProductivityMetrics(tasks: Task[]): Promise<ProductivityMetrics> {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      task => task.status === TimelineStatus.COMPLETED || task.status === TimelineStatus.RECENTLY_COMPLETED
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average task duration
    const durations = tasks.map(task => 
      getTimeDifference(task.startTime, task.endTime).totalMinutes
    );
    const averageTaskDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;

    // Calculate total time spent
    const totalTimeSpent = durations.reduce((sum, duration) => sum + duration, 0);

    // Calculate daily average
    const uniqueDays = new Set(tasks.map(task => task.createdAt.toDateString())).size;
    const dailyAverage = uniqueDays > 0 ? totalTimeSpent / uniqueDays : 0;

    // Calculate weekly trend (last 7 days)
    const weeklyTrend = this.calculateWeeklyTrend(tasks);

    return {
      totalTasks,
      completedTasks,
      completionRate,
      averageTaskDuration,
      totalTimeSpent,
      dailyAverage,
      weeklyTrend,
    };
  }

  // Analyze task patterns
  private async analyzeTaskPatterns(
    tasks: Task[],
    timelineEvents: TimelineEvent[]
  ): Promise<TaskPatterns> {
    // Peak hours analysis
    const hourCounts = new Map<number, number>();
    tasks.forEach(task => {
      const hour = task.startTime.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourCounts.entries())
      .map(([hour, taskCount]) => ({ hour, taskCount }))
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 5);

    // Common durations analysis
    const durationCounts = new Map<number, number>();
    tasks.forEach(task => {
      const duration = Math.round(getTimeDifference(task.startTime, task.endTime).totalMinutes / 15) * 15; // Round to 15-minute intervals
      durationCounts.set(duration, (durationCounts.get(duration) || 0) + 1);
    });

    const commonDurations = Array.from(durationCounts.entries())
      .map(([duration, frequency]) => ({ duration, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Priority distribution
    const priorityCounts = new Map<number, number>();
    tasks.forEach(task => {
      priorityCounts.set(task.priority, (priorityCounts.get(task.priority) || 0) + 1);
    });

    const priorityDistribution = Array.from(priorityCounts.entries())
      .map(([priority, count]) => ({
        priority,
        count,
        percentage: (count / tasks.length) * 100,
      }))
      .sort((a, b) => a.priority - b.priority);

    // Status transitions analysis
    const statusTransitions = this.analyzeStatusTransitions(timelineEvents);

    return {
      peakHours,
      commonDurations,
      priorityDistribution,
      statusTransitions,
    };
  }

  // Calculate performance metrics
  private async calculatePerformanceMetrics(tasks: Task[]): Promise<PerformanceMetrics> {
    const completedTasks = tasks.filter(
      task => task.status === TimelineStatus.COMPLETED || task.status === TimelineStatus.RECENTLY_COMPLETED
    );

    // On-time completion rate
    const onTimeTasks = completedTasks.filter(task => {
      const actualEndTime = task.updatedAt;
      return actualEndTime <= task.endTime;
    });
    const onTimeCompletion = completedTasks.length > 0 
      ? (onTimeTasks.length / completedTasks.length) * 100 
      : 0;

    // Average delay
    const delays = completedTasks
      .filter(task => task.updatedAt > task.endTime)
      .map(task => getTimeDifference(task.endTime, task.updatedAt).totalMinutes);
    const averageDelay = delays.length > 0 
      ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length 
      : 0;

    // Overdue rate
    const now = new Date();
    const overdueTasks = tasks.filter(
      task => task.status === TimelineStatus.UPCOMING && task.endTime < now
    );
    const overdueRate = tasks.length > 0 ? (overdueTasks.length / tasks.length) * 100 : 0;

    // Estimation accuracy (how close estimated vs actual duration)
    const estimationAccuracy = this.calculateEstimationAccuracy(completedTasks);

    // Current streak of productive days
    const streakDays = this.calculateStreakDays(tasks);

    return {
      onTimeCompletion,
      averageDelay,
      overdueRate,
      estimationAccuracy,
      streakDays,
    };
  }

  // Generate actionable insights
  private generateInsights(
    productivity: ProductivityMetrics,
    patterns: TaskPatterns,
    performance: PerformanceMetrics,
    tasks: Task[]
  ): TaskInsight[] {
    const insights: TaskInsight[] = [];

    // Productivity insights
    if (productivity.completionRate < 70) {
      insights.push({
        type: 'productivity',
        title: 'Low Completion Rate',
        description: `Your task completion rate is ${productivity.completionRate.toFixed(1)}%. Consider breaking down large tasks or adjusting your scheduling.`,
        impact: 'high',
        actionable: true,
        data: { completionRate: productivity.completionRate },
      });
    }

    if (productivity.averageTaskDuration > 120) {
      insights.push({
        type: 'productivity',
        title: 'Long Task Duration',
        description: `Your average task duration is ${productivity.averageTaskDuration.toFixed(0)} minutes. Consider breaking tasks into smaller chunks.`,
        impact: 'medium',
        actionable: true,
        data: { averageTaskDuration: productivity.averageTaskDuration },
      });
    }

    // Pattern insights
    if (patterns.peakHours.length > 0) {
      const peakHour = patterns.peakHours[0];
      insights.push({
        type: 'pattern',
        title: 'Peak Productivity Hour',
        description: `You're most productive at ${peakHour.hour}:00 with ${peakHour.taskCount} tasks. Schedule important work during this time.`,
        impact: 'medium',
        actionable: true,
        data: { peakHour: peakHour.hour },
      });
    }

    // Performance insights
    if (performance.onTimeCompletion < 80) {
      insights.push({
        type: 'performance',
        title: 'Frequent Delays',
        description: `Only ${performance.onTimeCompletion.toFixed(1)}% of tasks are completed on time. Consider more realistic time estimates.`,
        impact: 'high',
        actionable: true,
        data: { onTimeCompletion: performance.onTimeCompletion },
      });
    }

    if (performance.overdueRate > 20) {
      insights.push({
        type: 'performance',
        title: 'High Overdue Rate',
        description: `${performance.overdueRate.toFixed(1)}% of your tasks are overdue. Review your scheduling and priorities.`,
        impact: 'high',
        actionable: true,
        data: { overdueRate: performance.overdueRate },
      });
    }

    // Recommendation insights
    if (performance.streakDays > 7) {
      insights.push({
        type: 'recommendation',
        title: 'Great Streak!',
        description: `You've been productive for ${performance.streakDays} days straight. Keep up the momentum!`,
        impact: 'low',
        actionable: false,
        data: { streakDays: performance.streakDays },
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  // Helper methods
  private calculateWeeklyTrend(tasks: Task[]): number[] {
    const trend: number[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayTasks = tasks.filter(task => isSameDay(task.createdAt, date));
      const completedCount = dayTasks.filter(
        task => task.status === TimelineStatus.COMPLETED || task.status === TimelineStatus.RECENTLY_COMPLETED
      ).length;
      
      trend.push(completedCount);
    }
    
    return trend;
  }

  private analyzeStatusTransitions(timelineEvents: TimelineEvent[]): TaskPatterns['statusTransitions'] {
    const transitions = new Map<string, number>();
    
    // Group events by task
    const taskEvents = new Map<string, TimelineEvent[]>();
    timelineEvents.forEach(event => {
      if (!taskEvents.has(event.taskId)) {
        taskEvents.set(event.taskId, []);
      }
      taskEvents.get(event.taskId)!.push(event);
    });

    // Analyze transitions for each task
    taskEvents.forEach(events => {
      const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      for (let i = 1; i < sortedEvents.length; i++) {
        const from = sortedEvents[i - 1].status;
        const to = sortedEvents[i].status;
        const key = `${from}->${to}`;
        
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    });

    return Array.from(transitions.entries()).map(([transition, count]) => {
      const [from, to] = transition.split('->') as [TimelineStatus, TimelineStatus];
      return { from, to, count };
    });
  }

  private calculateEstimationAccuracy(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;

    const accuracies = completedTasks.map(task => {
      const estimated = getTimeDifference(task.startTime, task.endTime).totalMinutes;
      const actual = getTimeDifference(task.startTime, task.updatedAt).totalMinutes;
      
      if (estimated === 0) return 0;
      
      const accuracy = Math.max(0, 100 - Math.abs(estimated - actual) / estimated * 100);
      return accuracy;
    });

    return accuracies.reduce((sum, accuracy) => sum + accuracy, 0) / accuracies.length;
  }

  private calculateStreakDays(tasks: Task[]): number {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayTasks = tasks.filter(task => isSameDay(task.createdAt, date));
      const hasCompletedTasks = dayTasks.some(
        task => task.status === TimelineStatus.COMPLETED || task.status === TimelineStatus.RECENTLY_COMPLETED
      );
      
      if (hasCompletedTasks) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Export analytics data
  public async exportAnalytics(analytics: TaskAnalytics): Promise<string> {
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        analytics,
        summary: {
          totalTasks: analytics.productivity.totalTasks,
          completionRate: analytics.productivity.completionRate,
          onTimeCompletion: analytics.performance.onTimeCompletion,
          keyInsights: analytics.insights.slice(0, 3).map(insight => insight.title),
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'TaskAnalytics.exportAnalytics');
      throw new Error('Failed to export analytics data');
    }
  }
}

// Export singleton instance
export const taskAnalytics = TaskAnalytics.getInstance();