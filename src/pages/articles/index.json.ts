import type { APIRoute } from 'astro';
import { fetchArticles } from '../../lib/storyblok-fetch';

export type ArticleIndexEntry = {
  title: string;
  slug: string;
  description: string;
  author: string;
  publishDate: string;
  tags: string[];
  thumb: { src: string; alt: string } | null;
};

// Slim static index of all articles, consumed by the ArticlesBrowser island.
// fetchArticles() is already called elsewhere during the build and served from
// the shared Storyblok cache, so this endpoint adds no extra API traffic.
export const GET: APIRoute = async () => {
  const stories = await fetchArticles();

  const articles: ArticleIndexEntry[] = stories.map((story: any) => ({
    title: story.name,
    slug: story.slug,
    description: story.content?.description ?? '',
    author: story.content?.author ?? '',
    publishDate: story.content?.publishDate ?? story.first_published_at ?? '',
    tags: story.tag_list ?? [],
    thumb: story.content?.headerImage?.filename
      ? {
          src: story.content.headerImage.filename,
          alt: story.content.headerImage.alt ?? '',
        }
      : null,
  }));

  return new Response(JSON.stringify({ articles }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
