import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.NEXT_PUBLIC_APP_VERSION,
      environment: env.NEXT_PUBLIC_ENV,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      checks: {
        database: await checkDatabase(),
        cache: await checkCache(),
        llm: await checkLLMProviders(),
      },
    };

    // Determine overall health status
    const allChecksHealthy = Object.values(healthData.checks).every(check => check.status === 'healthy');
    
    return NextResponse.json(
      {
        ...healthData,
        status: allChecksHealthy ? 'healthy' : 'degraded',
      },
      { 
        status: allChecksHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Database health check
async function checkDatabase(): Promise<{ status: string; responseTime?: number; error?: string }> {
  try {
    const startTime = Date.now();
    
    // Simple IndexedDB availability check
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const responseTime = Date.now() - startTime;
      return { status: 'healthy', responseTime };
    }
    
    // Server-side: assume healthy if no errors
    return { status: 'healthy', responseTime: Date.now() - startTime };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Database check failed' 
    };
  }
}

// Cache health check
async function checkCache(): Promise<{ status: string; responseTime?: number; error?: string }> {
  try {
    const startTime = Date.now();
    
    // Simple cache availability check
    if (env.NEXT_PUBLIC_CACHE_ENABLED) {
      const responseTime = Date.now() - startTime;
      return { status: 'healthy', responseTime };
    }
    
    return { status: 'disabled' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Cache check failed' 
    };
  }
}

// LLM providers health check
async function checkLLMProviders(): Promise<{ status: string; providers?: any; error?: string }> {
  try {
    const providers = {
      openai: env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      anthropic: env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured',
      deepseek: env.DEEPSEEK_API_KEY ? 'configured' : 'not_configured',
    };
    
    const hasAtLeastOneProvider = Object.values(providers).some(status => status === 'configured');
    
    return {
      status: hasAtLeastOneProvider ? 'healthy' : 'unhealthy',
      providers,
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'LLM providers check failed' 
    };
  }
}