// Application constants

export const APP_CONFIG = {
  name: 'Vitordo',
  version: '0.1.0',
  description: 'Intelligent task management and timeline visualization',
} as const;

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
} as const;

export const STORAGE_KEYS = {
  tasks: 'vitordo_tasks',
  settings: 'vitordo_settings',
  user_preferences: 'vitordo_user_preferences',
  api_cache: 'vitordo_api_cache',
} as const;

export const UI_CONFIG = {
  debounceDelay: 300, // milliseconds
  animationDuration: 200, // milliseconds
  notificationDuration: 5000, // 5 seconds
  maxTasksPerPage: 50,
} as const;

export const TIME_CONFIG = {
  defaultTaskDuration: 30, // minutes
  maxTaskDuration: 1440, // 24 hours in minutes
  timeSlotInterval: 15, // minutes
  workingHours: {
    start: 9, // 9 AM
    end: 17, // 5 PM
  },
} as const;

export const VALIDATION_RULES = {
  minInputLength: 3,
  maxInputLength: 1000,
  minTaskTitle: 1,
  maxTaskTitle: 100,
  minTaskDescription: 1,
  maxTaskDescription: 500,
  priorityRange: [1, 5] as const,
} as const;

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  STORAGE_ERROR: 'STORAGE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export const LLM_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
} as const;

export const DEFAULT_PROMPTS = {
  TASK_PARSING: `You are a helpful assistant that parses natural language task descriptions into structured task data. 
Parse the following input and return a JSON array of tasks with the following structure:
- title: string (brief task title)
- description: string (detailed description)
- startTime: ISO date string
- endTime: ISO date string
- priority: number (1-5, where 5 is highest)
- estimatedDuration: number (in minutes)

Current time: {{currentTime}}
User input: {{userInput}}`,

  STATUS_UPDATE: `You are a helpful assistant that identifies task status updates from natural language input.
Analyze the following input and determine if it describes task completion or status changes.
Return a JSON array of status updates with this structure:
- taskId: string (if identifiable from context)
- newStatus: 'completed' | 'recently_completed' | 'upcoming'
- reason: string (explanation of the status change)

Context tasks: {{contextTasks}}
User input: {{userInput}}`,
} as const;