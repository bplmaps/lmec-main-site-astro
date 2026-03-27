/**
 * Build-time cache for Storyblok API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class StoryblokBuildCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Generate a cache key from API parameters
   */
  private getCacheKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return JSON.stringify(sortedParams);
  }

  /**
   * Get cached data if it exists
   * Note: Caching is disabled in Storyblok preview (SSR) mode to prevent stale draft content
   */
  get<T>(params: Record<string, any>): T | null {
    if (String(import.meta.env.STORYBLOK_IS_PREVIEW) === 'true') {
      return null;
    }

    const key = this.getCacheKey(params);
    const entry = this.cache.get(key);

    if (entry) {
      return entry.data as T;
    }

    return null;
  }

  /**
   * Store data in cache
   * Note: Caching is disabled in Storyblok preview (SSR) mode to prevent stale draft content
   */
  set<T>(params: Record<string, any>, data: T): void {
    if (String(import.meta.env.STORYBLOK_IS_PREVIEW) === 'true') {
      return;
    }

    const key = this.getCacheKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const storyblokCache = new StoryblokBuildCache();
