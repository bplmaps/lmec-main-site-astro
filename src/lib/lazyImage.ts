/**
 * Svelte action that defers loading an image until it scrolls into view.
 * Attach to an <img> that carries the real URL in `data-src`; the action
 * copies it into `src` once the element intersects the viewport.
 */
export function lazyImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLImageElement;
          if (el.dataset.src) {
            el.src = el.dataset.src;
          }
          obs.unobserve(el);
        }
      }
    },
    { rootMargin: "200px" }
  );

  observer.observe(img);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
