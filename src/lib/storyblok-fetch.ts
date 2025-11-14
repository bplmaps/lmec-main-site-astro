/**
 * Storyblok fetch utilities
 */

import { useStoryblokApi } from "@storyblok/astro";
import { storyblokCache } from "./storyblok-cache";

const STORYBLOK_API_BASE = 'https://api-us.storyblok.com/v2/cdn';

function buildStoryblokUrl(endpoint: string, params: Record<string, string>): string {
  const url = new URL(`${STORYBLOK_API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

async function fetchStoryblokApi<T>(url: string): Promise<T> {
  try {
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

async function getSpaceVersion(): Promise<number> {
  const SB_DATA = String(import.meta.env.SB_DATA_TOKEN);

  const cacheParams = {
    endpoint: 'spaces/me',
    token: 'version',
  };

  const cached = storyblokCache.get<number>(cacheParams);
  if (cached) {
    return cached;
  }

  const url = buildStoryblokUrl('spaces/me', { token: SB_DATA });
  const data = await fetchStoryblokApi<{ space: { version: number } }>(url);
  const version = data.space.version;

  storyblokCache.set(cacheParams, version);

  return version;
}

export function getVersion(): 'draft' | 'published' {
  return String(import.meta.env.STORYBLOK_IS_PREVIEW) === 'true' ? 'draft' : 'published';
}

export async function getDatasource(sourceName: string): Promise<any[]> {
  const SB_DATA = String(import.meta.env.SB_DATA_TOKEN);

  const cacheParams = {
    endpoint: 'datasource',
    sourceName: sourceName,
  };

  const cached = storyblokCache.get<any[]>(cacheParams);
  if (cached) {
    return cached;
  }

  const currentVersion = await getSpaceVersion();

  const url = buildStoryblokUrl('datasource_entries', {
    datasource: sourceName,
    token: SB_DATA,
    cv: String(currentVersion),
  });

  const data = await fetchStoryblokApi<{ datasource_entries: any[] }>(url);
  const entries = data.datasource_entries;

  storyblokCache.set(cacheParams, entries);

  return entries;
}

export async function fetchStory(uuid: string): Promise<any> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    endpoint: 'cdn/stories',
    version: getVersion(),
    uuid: uuid,
    find_by: 'uuid',
  };

  const cached = storyblokCache.get<any>(cacheParams);
  if (cached) {
    return cached;
  }

  const { data } = await storyblokApi.get('cdn/stories/' + uuid, {
    version: getVersion(),
    find_by: 'uuid',
  } as any);

  const story = (data as any).story;

  storyblokCache.set(cacheParams, story);

  return story;
}

export async function fetchStories(params: {
  starts_with?: string;
  content_type?: string;
  with_tag?: string;
  sort_by?: string;
  filter_query?: any;
  resolve_links?: string;
  per_page?: number;
}): Promise<any[]> {
  const storyblokApi = useStoryblokApi();

  const cacheParams = {
    ...params,
    version: getVersion(),
    endpoint: 'cdn/stories',
  };

  const cached = storyblokCache.get<any[]>(cacheParams);
  if (cached) {
    return cached;
  }

  const allStories: any[] = [];
  let page = 1;
  const perPage = params.per_page || 100;

  while (true) {
    const { data } = await storyblokApi.get('cdn/stories', {
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

  storyblokCache.set(cacheParams, allStories);

  return allStories;
}

export async function fetchArticles(options?: {
  sort_by?: string;
  per_page?: number;
}): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/articles',
    content_type: 'article-page',
    sort_by: options?.sort_by || 'sort_by_date:desc:nulls_last',
    per_page: options?.per_page,
  });
}

export async function fetchEvents(options?: {
  sort_by?: string;
  filter_query?: any;
  per_page?: number;
}): Promise<any[]> {
  return fetchStories({
    starts_with: 'main-site/event',
    content_type: 'event-page',
    sort_by: options?.sort_by,
    filter_query: options?.filter_query,
    per_page: options?.per_page,
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

  const cached = storyblokCache.get<any[]>(cacheParams);
  if (cached) {
    return cached;
  }

  const { data } = await storyblokApi.get('cdn/tags', {
    version: getVersion(),
    starts_with: cacheParams.starts_with,
    per_page: options?.per_page,
  });

  const tags = data.tags || [];

  storyblokCache.set(cacheParams, tags);

  return tags;
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

  const cached = storyblokCache.get<any[]>(cacheParams);
  if (cached) {
    return cached;
  }

  const { data } = await storyblokApi.get('cdn/stories', {
    version: getVersion(),
    starts_with: 'main-site/',
    resolve_links: 'url',
    content_type: 'article-page',
    sort_by: 'content.publishDate:desc',
    per_page: limit,
  } as any);

  let articles = (data as any).stories;
  articles = Object.values(articles);

  storyblokCache.set(cacheParams, articles);

  return articles;
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

  const cached = storyblokCache.get<any[]>(cacheParams);
  if (cached) {
    return cached;
  }

  const { data } = await storyblokApi.get('cdn/stories', {
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
  events = Object.values(events);

  storyblokCache.set(cacheParams, events);

  return events;
}

export async function fetchPagesInFolder(folder: string): Promise<any[]> {
  return fetchStories({
    starts_with: `main-site/${folder}/`,
    content_type: 'standard-lmec-main-page',
  });
}
