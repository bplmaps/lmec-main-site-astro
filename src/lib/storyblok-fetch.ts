/**
 * Storyblok fetch utilities
 */

import { useStoryblokApi } from "@storyblok/astro";
import { storyblokCache } from "./storyblok-cache";
import { createSlug } from './utils';

const STORYBLOK_API_BASE = 'https://api-us.storyblok.com/v2/cdn';

/**
 * Rate limiter for Storyblok API requests
 * Limits requests to a maximum number per second using a sliding window
 */
class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequestsPerSecond: number = 6) {
    this.maxRequests = maxRequestsPerSecond;
    this.windowMs = 1000; // 1 second window
  }

  /**
   * Wait until a request can be made within rate limits
   */
  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps outside the current window
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      // Calculate how long to wait until the oldest request falls out of the window
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp) + 10; // +10ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Recursively check again after waiting
        return this.throttle();
      }
    }
    
    // Record this request
    this.timestamps.push(Date.now());
  }
}

// Global rate limiter instance - 6 requests per second
const rateLimiter = new RateLimiter(6);

function buildStoryblokUrl(endpoint: string, params: Record<string, string>): string {
  const url = new URL(`${STORYBLOK_API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

async function fetchStoryblokApi<T>(url: string): Promise<T> {
  try {
    // Apply rate limiting before making the request
    await rateLimiter.throttle();
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[Storyblok Fetch] Error:', error);
    throw error;
  }
}

/**
 * Rate-limited wrapper for storyblokApi.get()
 */
async function rateLimitedStoryblokGet(
  storyblokApi: ReturnType<typeof useStoryblokApi>,
  endpoint: string,
  params: any
): Promise<any> {
  await rateLimiter.throttle();
  return storyblokApi.get(endpoint, params);
}

export function getVersion(): 'draft' | 'published' {
  return String(import.meta.env.STORYBLOK_IS_PREVIEW) === 'true' ? 'draft' : 'published';
}

/**
 * Helper function to wrap Storyblok API calls with caching
 * @param cacheParams Object used as cache key
 * @param fetchFn Function that fetches the data from Storyblok
 * @returns Cached data if available, otherwise fetches and caches the result
 */
async function cachedStoryblokFetch<T>(
  cacheParams: any,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = storyblokCache.get<T>(cacheParams);
  if (cached) {
    return cached;
  }

  const result = await fetchFn();
  storyblokCache.set(cacheParams, result);
  return result;
}

async function getSpaceVersion(): Promise<number> {
  const SB_DATA = String(import.meta.env.SB_DATA_TOKEN);

  const cacheParams = {
    endpoint: 'spaces/me',
    token: 'version',
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const url = buildStoryblokUrl('spaces/me', { token: SB_DATA });
    const data = await fetchStoryblokApi<{ space: { version: number } }>(url);
    return data.space.version;
  });
}

export async function getDatasource(sourceName: string): Promise<any[]> {
  const SB_DATA = String(import.meta.env.SB_DATA_TOKEN);

  const cacheParams = {
    endpoint: 'datasource',
    sourceName: sourceName,
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const currentVersion = await getSpaceVersion();

    const url = buildStoryblokUrl('datasource_entries', {
      datasource: sourceName,
      token: SB_DATA,
      cv: String(currentVersion),
    });

    const data = await fetchStoryblokApi<{ datasource_entries: any[] }>(url);
    return data.datasource_entries;
  });
}

export async function fetchStory(uuid: string): Promise<any> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    uuid: uuid,
    find_by: 'uuid',
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const { data } = await rateLimitedStoryblokGet(storyblokApi, 'cdn/stories/' + uuid, {
      version: getVersion(),
      find_by: 'uuid',
    } as any);

    return (data as any).story;
  });
}

export async function fetchStories(params: {
  starts_with?: string;
  content_type?: string;
  with_tag?: string;
  sort_by?: string;
  filter_query?: any;
  resolve_links?: string;
  per_page?: number;
  limit?: number;
}): Promise<any[]> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    ...params,
    version: getVersion(),
    endpoint: 'cdn/stories',
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    // If limit is provided, fetch only a single page
    if (params.limit) {
      const { limit, ...apiParams } = params;

      const { data } = await rateLimitedStoryblokGet(storyblokApi, 'cdn/stories', {
        version: getVersion(),
        ...apiParams,
        per_page: limit,
        page: 1,
      } as any);

      let stories = (data as any).stories;
      return Object.values(stories);
    }

    // Otherwise, fetch all stories by paginating
    const allStories: any[] = [];
    let page = 1;
    const perPage = params.per_page || 100;

    while (true) {
      const { data } = await rateLimitedStoryblokGet(storyblokApi, 'cdn/stories', {
        version: getVersion(),
        ...params,
        per_page: perPage,
        page: page,
      } as any);

      let stories = (data as any).stories;
      stories = Object.values(stories);

      if (stories.length === 0) {
        break;
      }

      allStories.push(...stories);
      page++;
    }

    return allStories;
  });
}

export async function fetchArticles(options?: {
  sort_by?: string;
  per_page?: number;
  limit?: number;
}): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/articles',
    content_type: 'article-page',
    sort_by: options?.sort_by || 'content.publishDate:desc',
    per_page: options?.per_page,
    limit: options?.limit,
  });
}

export async function fetchEvents(options?: {
  sort_by?: string;
  filter_query?: any;
  per_page?: number;
  limit?: number;
}): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/event',
    content_type: 'event-page',
    sort_by: options?.sort_by,
    filter_query: options?.filter_query,
    per_page: options?.per_page,
    limit: options?.limit,
  });
}

export async function fetchNewsletters(options?: {
  sort_by?: string;
}): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/newsletters',
    content_type: 'newsletter-page',
    sort_by: options?.sort_by,
  });
}

export async function fetchStaffPages(options?: {
  sort_by?: string;
}): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/about/people',
    content_type: 'staff-page',
    sort_by: options?.sort_by,
  });
}

export async function fetchStandardPages(): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/',
    content_type: 'standard-lmec-main-page',
  });
}

export async function fetchTags(options?: {
  starts_with?: string;
  per_page?: number;
}): Promise<any[]> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    endpoint: 'cdn/tags',
    version: getVersion(),
    starts_with: options?.starts_with || 'main-site/',
    per_page: options?.per_page,
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const { data } = await rateLimitedStoryblokGet(storyblokApi, 'cdn/tags', {
      version: getVersion(),
      starts_with: cacheParams.starts_with,
      per_page: options?.per_page,
    });

    return data.tags || [];
  });
}

export async function fetchStoriesByTag(tagName: string): Promise<any[]> {
  return fetchStories({
    with_tag: tagName,
    starts_with: 'main-site/',
  });
}

export async function fetchTopTags(limit: number = 20): Promise<any[]> {
  const tags = await fetchTags({
    starts_with: 'main-site/',
  });

  return tags
    .sort((a, b) => (b.taggings_count || 0) - (a.taggings_count || 0))
    .slice(0, limit);
}

export async function fetchLatestArticles(limit: number = 3): Promise<any[]> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    starts_with: 'main-site/',
    per_page: limit,
    content_type: 'article-page',
    sort_by: 'content.publishDate:desc',
    resolve_links: 'url',
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const { data } = await rateLimitedStoryblokGet(storyblokApi, 'cdn/stories', {
      version: getVersion(),
      starts_with: 'main-site/',
      resolve_links: 'url',
      content_type: 'article-page',
      sort_by: 'content.publishDate:desc',
      per_page: limit,
    } as any);

    let articles = (data as any).stories;
    return Object.values(articles);
  });
}

export async function fetchUpcomingEvents(limit?: number): Promise<any[]> {
  const storyblokApi = useStoryblokApi();
  const today = new Date().toISOString().split('T')[0] + '00:00';

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    starts_with: 'main-site/',
    per_page: limit,
    content_type: 'event-page',
    sort_by: 'content.eventDate:asc',
    filter_query: { eventDate: { gt_date: today } },
    resolve_links: 'url',
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const { data } = await rateLimitedStoryblokGet(storyblokApi, 'cdn/stories', {
      version: getVersion(),
      starts_with: 'main-site/',
      resolve_links: 'url',
      content_type: 'event-page',
      sort_by: 'content.eventDate:asc',
      filter_query: {
        eventDate: {
          gt_date: today,
        }
      },
      per_page: limit,
    } as any);

    let events = (data as any).stories;
    return Object.values(events);
  });
}

export async function fetchPagesInFolder(folder: string): Promise<any[]> {
  return fetchStories({
    starts_with: `main-site/${folder}/`,
    content_type: 'standard-lmec-main-page',
  });
}

export async function fetchFolderStartpage(folder: string): Promise<any | null> {
  const storyblokApi = useStoryblokApi();
  const storyPath = `main-site/${folder}`;

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    path: storyPath,
    type: 'startpage',
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    try {
      const { data } = await rateLimitedStoryblokGet(storyblokApi, `cdn/stories/${storyPath}`, {
        version: getVersion(),
      } as any);

      const story = (data as any).story;
      if (story && story.is_startpage) {
        return story;
      }
      return null;
    } catch (error) {
      return null;
    }
  });
}

export interface HierarchicalPage {
  name: string;
  position: number;
  full_slug: string;
  is_startpage: boolean;
  content: any;
  children: HierarchicalPage[];
}

export async function fetchHierarchicalPagesInFolder(folder: string): Promise<HierarchicalPage[]> {
  const allPages = await fetchStories({
    starts_with: `main-site/${folder}/`,
  });

  const folderMap = new Map<string, any[]>();
  const basePath = `main-site/${folder}`;

  const rootStartpagePath = `main-site/${folder}/`;
  const filteredPages = allPages.filter(page => page.full_slug !== rootStartpagePath);

  for (const page of filteredPages) {
    // Strip trailing slash first (startpages have trailing slashes like 'main-site/education/k12/')
    const normalizedSlug = page.full_slug.replace(/\/$/, '');
    const slugParts = normalizedSlug.split('/');
    slugParts.pop(); // Remove the page slug itself
    const parentPath = slugParts.join('/');

    if (!folderMap.has(parentPath)) {
      folderMap.set(parentPath, []);
    }
    folderMap.get(parentPath)!.push(page);
  }

  function buildTree(folderPath: string, visited: Set<string> = new Set()): HierarchicalPage[] {
    // Prevent infinite recursion
    if (visited.has(folderPath)) {
      return [];
    }
    visited.add(folderPath);

    const pagesInFolder = folderMap.get(folderPath) || [];

    pagesInFolder.sort((a, b) => (a.position || 0) - (b.position || 0));

    const result: HierarchicalPage[] = [];

    for (const page of pagesInFolder) {
      const childFolderPath = page.full_slug.replace(/\/$/, '');
      const hasChildren = folderMap.has(childFolderPath);

      let children: HierarchicalPage[] = [];
      if (hasChildren) {
        children = buildTree(childFolderPath, visited);
      }

      result.push({
        name: page.name,
        position: page.position || 0,
        full_slug: page.full_slug,
        is_startpage: page.is_startpage || false,
        content: page.content,
        children: children,
      });
    }

    return result;
  }

  return buildTree(basePath);
}

export async function fetchStoryByPath(path: string): Promise<any> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    path: path,
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const { data } = await rateLimitedStoryblokGet(storyblokApi, `cdn/stories/${path}`, {
      version: getVersion(),
    } as any);

    return (data as any).story;
  });
}

export async function fetchTagsWithSlugs(options?: {
  starts_with?: string;
  per_page?: number;
}): Promise<any[]> {
  const tags = await fetchTags(options);

  return tags.map((tag: any) => ({
    name: tag.name,
    taggings_count: tag.taggings_count,
    slug: createSlug(tag.name),
  }));
}

export async function fetchStoriesPaginated(params: {
  page: number;
  per_page: number;
  starts_with?: string;
  content_type?: string;
  with_tag?: string;
  sort_by?: string;
  resolve_links?: string;
}): Promise<{ stories: any[]; total: number }> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    ...params,
  };

  return cachedStoryblokFetch(cacheParams, async () => {
    const response = await rateLimitedStoryblokGet(storyblokApi, 'cdn/stories', {
      version: getVersion(),
      ...params,
    } as any);

    let total = 0;
    if (response.total !== undefined) {
      total = response.total;
    } else if (response.headers && typeof response.headers.get === 'function') {
      const headerTotal = response.headers.get('Total') || response.headers.get('total');
      total = headerTotal ? parseInt(headerTotal, 10) : 0;
    } else if (response.data?.total !== undefined) {
      total = response.data.total;
    }

    if (isNaN(total) || total < 0) {
      total = 0;
    }

    return {
      stories: Object.values((response.data as any).stories),
      total: total,
    };
  });
}
