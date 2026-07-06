import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { fetchArticles } from '../../lib/storyblok-fetch';

export const GET: APIRoute = async (context) => {
  const stories = await fetchArticles();

  return rss({
    title: 'Articles - Leventhal Map & Education Center',
    description:
      'Articles and posts that explore and explain the collections and initiatives of the Leventhal Map & Education Center at the Boston Public Library',
    site: context.site ?? 'https://www.leventhalmap.org',
    items: stories.map((story: any) => ({
      title: story.name,
      description: story.content?.description ?? '',
      link: `/articles/${story.slug}/`,
      pubDate: new Date(story.content?.publishDate ?? story.first_published_at),
      author: story.content?.author,
      categories: story.tag_list ?? [],
    })),
  });
};
