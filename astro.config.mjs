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
        'article-page': 'storyblok/ArticlePage',
        'event-page': 'storyblok/EventPage',
        'newsletter-page': 'storyblok/NewsletterPage',
        'staff-page': 'storyblok/StaffPage',
        'standard-lmec-main-page': 'storyblok/StandardLmecMainPage',
        'alert-box': 'storyblok/nestable/AlertBox',
        'button': 'storyblok/nestable/Button',
        'card-holder': 'storyblok/nestable/CardHolder',
        'carousel': 'storyblok/nestable/Carousel',
        'cartography-challenges': 'storyblok/nestable/CartographyChallenges',
        'digital-collections-union-search': 'storyblok/nestable/UnionSearch',
        'education-listing': 'storyblok/nestable/EducationListing',
        'event-tag-listing': 'storyblok/nestable/EventTagListing',
        'exhibition-events': 'storyblok/nestable/ExhibitionEvents',
        'figure': 'storyblok/nestable/Figure',
        'grant-in-aid': 'storyblok/nestable/GrantInAid',
        'hours-table': 'storyblok/nestable/HoursTable',
        'html-block': 'storyblok/nestable/HtmlBlock',
        'small-grants': 'storyblok/nestable/SmallGrants',
        'staff-list': 'storyblok/nestable/StaffList',
      },
      apiOptions: {
        region: 'us',
      },
    })
  ],
});
