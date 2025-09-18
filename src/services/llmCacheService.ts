import { cacheService } from './cacheService';
import { LLMResponse } from '@/types/api';
import { Task } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';

export interface LLMCacheEntry {
  input: string;
  context?: Task[];
  response: LLMResponse;
  timestamp: number;
  hitCount: number;
  provider: string;
}

export interface LLMCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxEntries?: number;
  enableContextSensitive?: boolean;
  similarityThreshold?: number; // For fuzzy matching
}

export class LLMCacheService {
  private static instance: LLMCacheService;
  private options: Required<LLMCacheOptions>;
  private hitStats: Map<string, number> = new Map();
  private missCount: number = 0;

  private constructor(options: LLMCacheOptions = {}) {
    this.options = {
      ttl: 30 * 60 * 1000, // 30 minutes default
      maxEntries: 100,
      enableContextSensitive: true,
      similarityThreshold: 0.8,
      ...options,
    };
  }

  public static getInstance(options?: LLMCacheOptions): LLMCacheService {
    if (!LLMCacheService.instance) {
      LLMCacheService.instance = new LLMCacheService(options);
    }
    return LLMCacheService.instance;
  }

  // Cache LLM response with context awareness
  public async cacheResponse(
    input: string,
    response: LLMResponse,
    context?: Task[],
    provider: string = 'default'
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(input, context);
      const entry: LLMCacheEntry = {
        input,
        context,
        response,
        timestamp: Date.now(),
        hitCount: 0,
        provider,
      };

      await cacheService.set(cacheKey, entry, this.options.ttl);
      
      // Update hit stats
      this.hitStats.set(cacheKey, 0);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMCacheService.cacheResponse');
    }
  }

  // Get cached response with fuzzy matching
  public async getCachedResponse(
    input: string,
    context?: Task[],
    enableFuzzyMatch: boolean = true
  ): Promise<LLMResponse | null> {
    try {
      // Try exact match first
      const exactKey = this.generateCacheKey(input, context);
      let entry = cacheService.get<LLMCacheEntry>(exactKey);

      if (entry) {
        entry.hitCount++;
        this.hitStats.set(exactKey, entry.hitCount);
        await cacheService.set(exactKey, entry, this.options.ttl); // Refresh TTL
        return entry.response;
      }

      // Try fuzzy matching if enabled
      if (enableFuzzyMatch) {
        entry = await this.findSimilarEntry(input, context);
        if (entry) {
          const key = this.generateCacheKey(entry.input, entry.context);
          entry.hitCount++;
          this.hitStats.set(key, entry.hitCount);
          await cacheService.set(key, entry, this.options.ttl);
          return entry.response;
        }
      }

      this.missCount++;
      return null;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMCacheService.getCachedResponse');
      return null;
    }
  }

  // Check if response is cached
  public hasCachedResponse(input: string, context?: Task[]): boolean {
    const cacheKey = this.generateCacheKey(input, context);
    return cacheService.has(cacheKey);
  }

  // Invalidate cache entries
  public async invalidateCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Invalidate entries matching pattern
        const stats = cacheService.getStats();
        const keysToDelete = stats.entries
          .filter(entry => entry.key.includes(pattern))
          .map(entry => entry.key);

        for (const key of keysToDelete) {
          await cacheService.delete(key.replace('vitordo_cache_', ''));
          this.hitStats.delete(key);
        }
      } else {
        // Clear all LLM cache
        await cacheService.clear();
        this.hitStats.clear();
        this.missCount = 0;
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMCacheService.invalidateCache');
    }
  }

  // Get cache statistics
  public getCacheStats(): {
    totalEntries: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    topHitEntries: Array<{ key: string; hits: number }>;
    memoryUsage: number;
  } {
    const cacheStats = cacheService.getStats();
    const totalHits = Array.from(this.hitStats.values()).reduce((sum, hits) => sum + hits, 0);
    const hitRate = totalHits + this.missCount > 0 ? (totalHits / (totalHits + this.missCount)) * 100 : 0;

    const topHitEntries = Array.from(this.hitStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, hits]) => ({ key, hits }));

    const memoryUsage = cacheStats.entries.reduce((sum, entry) => sum + entry.size, 0);

    return {
      totalEntries: cacheStats.size,
      hitRate,
      totalHits,
      totalMisses: this.missCount,
      topHitEntries,
      memoryUsage,
    };
  }

  // Preload common responses
  public async preloadCommonResponses(commonInputs: string[]): Promise<void> {
    const preloadPromises = commonInputs.map(async (input) => {
      if (!this.hasCachedResponse(input)) {
        // This would typically involve calling the LLM service
        // For now, we'll just mark these as candidates for preloading
        console.log(`Preload candidate: ${input}`);
      }
    });

    await Promise.all(preloadPromises);
  }

  // Optimize cache by removing least used entries
  public async optimizeCache(): Promise<number> {
    try {
      const stats = cacheService.getStats();
      
      if (stats.size <= this.options.maxEntries) {
        return 0;
      }

      // Sort entries by hit count (ascending) and age (descending)
      const entriesToRemove = Array.from(this.hitStats.entries())
        .sort(([, hitsA], [, hitsB]) => hitsA - hitsB)
        .slice(0, stats.size - this.options.maxEntries)
        .map(([key]) => key);

      let removedCount = 0;
      for (const key of entriesToRemove) {
        await cacheService.delete(key.replace('vitordo_cache_', ''));
        this.hitStats.delete(key);
        removedCount++;
      }

      return removedCount;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMCacheService.optimizeCache');
      return 0;
    }
  }

  // Private methods
  private generateCacheKey(input: string, context?: Task[]): string {
    let key = `llm_${this.hashString(input)}`;
    
    if (this.options.enableContextSensitive && context && context.length > 0) {
      const contextHash = this.hashString(JSON.stringify(context.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
      }))));
      key += `_ctx_${contextHash}`;
    }
    
    return key;
  }

  private async findSimilarEntry(
    input: string,
    context?: Task[]
  ): Promise<LLMCacheEntry | null> {
    try {
      const stats = cacheService.getStats();
      const llmEntries = stats.entries.filter(entry => 
        entry.key.startsWith('vitordo_cache_llm_')
      );

      for (const entryInfo of llmEntries) {
        const entry = cacheService.get<LLMCacheEntry>(
          entryInfo.key.replace('vitordo_cache_', '')
        );
        
        if (!entry) continue;

        const similarity = this.calculateSimilarity(input, entry.input);
        if (similarity >= this.options.similarityThreshold) {
          // Check context similarity if context-sensitive
          if (this.options.enableContextSensitive && context && entry.context) {
            const contextSimilarity = this.calculateContextSimilarity(context, entry.context);
            if (contextSimilarity >= this.options.similarityThreshold) {
              return entry;
            }
          } else if (!this.options.enableContextSensitive || (!context && !entry.context)) {
            return entry;
          }
        }
      }

      return null;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'LLMCacheService.findSimilarEntry');
      return null;
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity for demonstration
    // In production, you might want to use more sophisticated algorithms
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private calculateContextSimilarity(context1: Task[], context2: Task[]): number {
    if (context1.length === 0 && context2.length === 0) return 1;
    if (context1.length === 0 || context2.length === 0) return 0;

    const ids1 = new Set(context1.map(t => t.id));
    const ids2 = new Set(context2.map(t => t.id));
    
    const intersection = new Set([...ids1].filter(x => ids2.has(x)));
    const union = new Set([...ids1, ...ids2]);
    
    return intersection.size / union.size;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const llmCacheService = LLMCacheService.getInstance();

// Hook for using LLM cache in components
export function useLLMCache() {
  const cache = LLMCacheService.getInstance();

  const getCachedResponse = async (
    input: string,
    context?: Task[],
    enableFuzzyMatch?: boolean
  ): Promise<LLMResponse | null> => {
    return cache.getCachedResponse(input, context, enableFuzzyMatch);
  };

  const cacheResponse = async (
    input: string,
    response: LLMResponse,
    context?: Task[],
    provider?: string
  ): Promise<void> => {
    await cache.cacheResponse(input, response, context, provider);
  };

  const invalidateCache = async (pattern?: string): Promise<void> => {
    await cache.invalidateCache(pattern);
  };

  return {
    getCachedResponse,
    cacheResponse,
    invalidateCache,
    hasCachedResponse: cache.hasCachedResponse.bind(cache),
    getCacheStats: cache.getCacheStats.bind(cache),
    optimizeCache: cache.optimizeCache.bind(cache),
  };
}