<script lang="ts">
  import { fly } from "svelte/transition";
  import PastEventCard from "./PastEventCard.svelte";
  import type { PastEvent } from "./PastEventCard.svelte";

  export let events: PastEvent[] = [];

  const PAGE_SIZE = 6;

  // Svelte fly transitions run in JS, so the global prefers-reduced-motion
  // CSS kill-switch doesn't reach them — gate them here.
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SLIDE = prefersReducedMotion ? 0 : 80;
  const DURATION = prefersReducedMotion ? 0 : 200;

  let query = "";
  let page = 0;
  // 1 = advancing (slide left), -1 = going back (slide right).
  let direction = 1;

  // Lock the viewport to the tallest page seen while paginating so a short
  // last page doesn't collapse the container and yank the controls upward.
  let viewportEl: HTMLElement | undefined;
  let lockedMinHeight = 0;

  $: filtered = query.trim()
    ? events.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : events;
  $: totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp the page when the filtered set shrinks below the current page.
  $: if (page > totalPages - 1) page = totalPages - 1;
  $: pageEvents = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleInput = (): void => {
    // Filters legitimately shrink the list, so release the height lock —
    // and don't scroll: the user is typing, not navigating.
    lockedMinHeight = 0;
    direction = 1;
    page = 0;
  };

  const scrollToListTop = (): void => {
    // Only pull the viewport back when its top has scrolled out of view;
    // the global scroll-margin-top keeps the fixed header clear.
    if (viewportEl && viewportEl.getBoundingClientRect().top < 0) {
      viewportEl.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  const lockHeight = (): void => {
    if (viewportEl) {
      lockedMinHeight = Math.max(lockedMinHeight, viewportEl.offsetHeight);
    }
  };

  const prevPage = (): void => {
    if (page > 0) {
      direction = -1;
      lockHeight();
      page -= 1;
      scrollToListTop();
    }
  };

  const nextPage = (): void => {
    if (page < totalPages - 1) {
      direction = 1;
      lockHeight();
      page += 1;
      scrollToListTop();
    }
  };
</script>

<div class="mb-4">
  <input
    bind:value={query}
    on:input={handleInput}
    class="form-control form-control-lg"
    type="text"
    placeholder="Filter past events by title"
    aria-label="Filter past events by title"
  />
</div>

{#if filtered.length === 0}
  <p class="text-muted">No events match your search.</p>
{:else}
  <div
    class="events-viewport"
    bind:this={viewportEl}
    style:min-height={lockedMinHeight ? `${lockedMinHeight}px` : null}
  >
    {#key page}
      <div
        class="row"
        in:fly={{ x: direction * SLIDE, duration: DURATION }}
        out:fly={{ x: direction * -SLIDE, duration: DURATION }}
      >
        {#each pageEvents as event (event.slug)}
          <div class="col-lg-4 col-md-6 mb-4">
            <PastEventCard {event} />
          </div>
        {/each}
      </div>
    {/key}
  </div>

  <div class="d-flex justify-content-center align-items-center gap-3 mt-2">
    <button
      class="btn btn-primary"
      type="button"
      on:click={prevPage}
      disabled={page === 0}
    >
      &larr; More Recent
    </button>
    <button
      class="btn btn-primary"
      type="button"
      on:click={nextPage}
      disabled={page >= totalPages - 1}
    >
      Older &rarr;
    </button>
  </div>
{/if}

<style>
  /* Stack the outgoing and incoming pages in one grid cell so the fly
     transition reads as a horizontal swipe without a vertical jump. */
  .events-viewport {
    display: grid;
    overflow-x: hidden;
  }
  .events-viewport > * {
    grid-area: 1 / 1;
  }
</style>
