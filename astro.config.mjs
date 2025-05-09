import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';

const env = loadEnv("", process.cwd(), 'STORYBLOK');

// https://astro.build/config
export default defineConfig({
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_TOKEN,
      components: {
        'root': 'storyblok/Root',
        'alert-box': 'storyblok/AlertBox',
        'article-page': 'storyblok/ArticlePage',
        'event-page': 'storyblok/EventPage',
        'staff-page': 'storyblok/StaffPage',
        'standard-lmec-main-page': 'storyblok/StandardLmecMainPage',
      },
      apiOptions: {
        region: 'us',
      },
    })
  ],
});
