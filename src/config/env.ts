/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

// Environment validation schema
interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_ENV: 'development' | 'production' | 'test';
  
  // API Keys (server-side only)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  
  // Public configuration
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_APP_URL: string;
  
  // LLM Configuration
  NEXT_PUBLIC_DEFAULT_LLM_PROVIDER: 'openai' | 'anthropic' | 'deepseek';
  NEXT_PUBLIC_LLM_CACHE_ENABLED: boolean;
  NEXT_PUBLIC_LLM_CACHE_TTL: number;
  
  // Database
  NEXT_PUBLIC_DB_NAME: string;
  NEXT_PUBLIC_DB_VERSION: number;
  
  // Performance
  NEXT_PUBLIC_CACHE_ENABLED: boolean;
  NEXT_PUBLIC_CACHE_TTL: number;
  NEXT_PUBLIC_DEBOUNCE_DELAY: number;
  
  // Security & Privacy
  NEXT_PUBLIC_ENABLE_ANALYTICS: boolean;
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: boolean;
  
  // Development
  NEXT_PUBLIC_DEBUG_MODE: boolean;
  NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR: boolean;
}

// Helper function to parse boolean environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper function to parse number environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};// Envir
onment configuration with defaults and validation
export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  NEXT_PUBLIC_ENV: (process.env.NEXT_PUBLIC_ENV as EnvConfig['NEXT_PUBLIC_ENV']) || 'development',
  
  // API Keys (only available server-side)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  
  // Public configuration
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Vitordo',
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // LLM Configuration
  NEXT_PUBLIC_DEFAULT_LLM_PROVIDER: (process.env.NEXT_PUBLIC_DEFAULT_LLM_PROVIDER as 'openai' | 'anthropic' | 'deepseek') || 'openai',
  NEXT_PUBLIC_LLM_CACHE_ENABLED: parseBoolean(process.env.NEXT_PUBLIC_LLM_CACHE_ENABLED, true),
  NEXT_PUBLIC_LLM_CACHE_TTL: parseNumber(process.env.NEXT_PUBLIC_LLM_CACHE_TTL, 30),
  
  // Database
  NEXT_PUBLIC_DB_NAME: process.env.NEXT_PUBLIC_DB_NAME || 'vitordo_db',
  NEXT_PUBLIC_DB_VERSION: parseNumber(process.env.NEXT_PUBLIC_DB_VERSION, 1),
  
  // Performance
  NEXT_PUBLIC_CACHE_ENABLED: parseBoolean(process.env.NEXT_PUBLIC_CACHE_ENABLED, true),
  NEXT_PUBLIC_CACHE_TTL: parseNumber(process.env.NEXT_PUBLIC_CACHE_TTL, 300),
  NEXT_PUBLIC_DEBOUNCE_DELAY: parseNumber(process.env.NEXT_PUBLIC_DEBOUNCE_DELAY, 300),
  
  // Security & Privacy
  NEXT_PUBLIC_ENABLE_ANALYTICS: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS, false),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING, false),
  
  // Development
  NEXT_PUBLIC_DEBUG_MODE: parseBoolean(process.env.NEXT_PUBLIC_DEBUG_MODE, false),
  NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR: parseBoolean(process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR, false),
};

// Environment validation
export const validateEnv = (): void => {
  const errors: string[] = [];
  
  // Validate required environment variables
  if (env.NODE_ENV === 'production') {
    if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY && !env.DEEPSEEK_API_KEY) {
      errors.push('At least one LLM API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY) is required in production');
    }
    
    if (!env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
      errors.push('NEXT_PUBLIC_APP_URL must be set to production URL');
    }
  }
  
  // Validate LLM provider
  if (!['openai', 'anthropic', 'deepseek'].includes(env.NEXT_PUBLIC_DEFAULT_LLM_PROVIDER)) {
    errors.push('NEXT_PUBLIC_DEFAULT_LLM_PROVIDER must be one of: "openai", "anthropic", or "deepseek"');
  }
  
  if (errors.length > 0) {
    console.error('Environment validation errors:');
    errors.forEach(error => console.error(`- ${error}`));
    throw new Error('Environment validation failed');
  }
};

// Utility functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags
export const features = {
  analytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  errorReporting: env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  debugMode: env.NEXT_PUBLIC_DEBUG_MODE,
  performanceMonitor: env.NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR,
  caching: env.NEXT_PUBLIC_CACHE_ENABLED,
  llmCaching: env.NEXT_PUBLIC_LLM_CACHE_ENABLED,
} as const;

// Export types
export type { EnvConfig };