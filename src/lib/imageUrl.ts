/**
 * Width-constrained variants of CDN image URLs, so cards and headers don't
 * ship full-resolution originals into small layout slots.
 */

/**
 * Return a width-constrained variant of a CDN image URL.
 *
 * - Storyblok assets get the image service `/m/{width}x0` suffix (preserves
 *   aspect ratio, serves WebP where supported).
 * - IIIF Image API URLs (Digital Commonwealth) get their size segment
 *   rewritten to `{width},`.
 * - URLs from any other host pass through unchanged.
 */
export function sizedImageUrl (url: string, width: number): string {
  if (!url) return url;
  // Editor-pasted URLs sometimes carry stray whitespace
  url = url.trim();

  if (/^https:\/\/a(-us)?\.storyblok\.com\/f\//.test(url) && !url.includes('/m/')) {
    return `${url}/m/${width}x0`;
  }

  const iiif = url.match(
    /^(https:\/\/iiif\.digitalcommonwealth\.org\/iiif\/2\/[^/]+\/[^/]+\/)[^/]+(\/\d+\/default\.jpg)$/
  );
  if (iiif) {
    return `${iiif[1]}${width},${iiif[2]}`;
  }

  return url;
}
