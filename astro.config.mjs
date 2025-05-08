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
        'article-page': 'storyblok/RichText',
        'event-page': 'storyblok/RichText',
        'standard-lmec-main-page': 'storyblok/StandardLmecMainPage',
        'digital-collections-union-search': 'storyblok/DigitalCollectionsUnionSearch',
      },
      apiOptions: {
        region: 'us',
      },
    })
  ],
});
