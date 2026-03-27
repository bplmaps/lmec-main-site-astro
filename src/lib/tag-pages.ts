/** Stories under main-site/ that include the tag (matches Storyblok `with_tag` + `starts_with`) */
export function storiesForTag(tagName: string, allStories: any[]): any[] {
  return allStories.filter(
    (s) => Array.isArray(s.tag_list) && s.tag_list.includes(tagName)
  );
}

/** Ordering similar to CDN listings (newest first) */
export function sortStoriesByPublishedAtDesc(stories: any[]): any[] {
  return [...stories].sort((a, b) => {
    const ta = new Date(a.published_at || 0).getTime();
    const tb = new Date(b.published_at || 0).getTime();
    return tb - ta;
  });
}
