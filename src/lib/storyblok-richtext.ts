/**
 * Shared Storyblok rich text rendering.
 *
 * All rich text should be rendered through renderStoryblokRichText so that
 * internal story links are rewritten site-relative (the Storyblok space roots
 * this project's content in the /main-site folder, which does not exist in
 * the site's own URL structure).
 */

import { renderRichText } from '@storyblok/richtext';
import { getPath } from './utils';

// blok nodes are extracted and rendered as real Astro components by
// RichText.astro; everywhere else they have no HTML representation. A custom
// renderer is required either way — without one, v5 warns on every blok node.
const baseRenderers = { blok: () => '' };

/** '/main-site/subscribe' or 'main-site/subscribe' -> '/subscribe' */
export function getInternalHref (href: string) {
  return '/' + getPath(href.replace(/^\//, ''));
}

interface RichTextNode {
  type?: string;
  content?: RichTextNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

/**
 * Rewrite the hrefs of internal story links in a rich text tree, in place.
 * Only touches marks with linktype 'story'; url/asset/email links and
 * anchor/target/custom attrs pass through untouched. Idempotent, so it is
 * safe to run against stories held in the shared build cache.
 */
export function fixStoryLinks<T extends RichTextNode> (node: T): T {
  if (node?.marks) {
    for (const mark of node.marks) {
      if (
        mark.type === 'link' &&
        mark.attrs?.linktype === 'story' &&
        typeof mark.attrs.href === 'string'
      ) {
        mark.attrs.href = getInternalHref(mark.attrs.href);
      }
    }
  }

  if (Array.isArray(node?.content)) {
    for (const child of node.content) {
      fixStoryLinks(child);
    }
  }

  return node;
}

/** Render a rich text document (or a single node) to an HTML string. */
export function renderStoryblokRichText (doc: unknown) {
  fixStoryLinks(doc as RichTextNode);
  return renderRichText(doc as Parameters<typeof renderRichText>[0], { renderers: baseRenderers });
}

interface Multilink {
  linktype?: string;
  cached_url?: string;
  url?: string;
  email?: string;
  anchor?: string;
}

/** Resolve a Storyblok multilink field (e.g. a button link) to an href. */
export function resolveMultilink (link: Multilink) {
  if (!link) return '';

  if (link.linktype === 'story' && link.cached_url) {
    const anchor = link.anchor ? `#${link.anchor}` : '';
    return getInternalHref(link.cached_url) + anchor;
  }

  if (link.linktype === 'email') {
    const email = link.email || link.cached_url || '';
    return email ? `mailto:${email.replace(/^mailto:/, '')}` : '';
  }

  return link.cached_url || link.url || '';
}
