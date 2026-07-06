<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import ArticleCard from "./ArticleCard.svelte";
  import type { ArticleIndexEntry } from "./ArticleCard.svelte";
  import BrowserPagination from "./BrowserPagination.svelte";

  // Progressive enhancement: the static server-rendered page-1 grid (wrapped
  // in #articles-static-listing) stays in the DOM and is hidden only after the
  // article index loads successfully. No JS, or a failed fetch, leaves the
  // static listing and its /articles/page/N pagination fully usable.
  export let pageSize = 10;
  export let indexUrl = "/articles/index.json";
  export let staticListingId = "articles-static-listing";

  const SLIDE = 400;

  let articles: ArticleIndexEntry[] = [];
  let loaded = false;
  let query = "";
  let selectedTag = "";
  let sort: "newest" | "oldest" | "title" = "newest";
  let page = 0; // 0-based internally; 1-based in the UI/URL
  // 1 = advancing (slide left), -1 = going back (slide right).
  let direction = 1;

  onMount(async () => {
    try {
      const res = await fetch(indexUrl);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.articles)) return;
      articles = data.articles;

      // Restore state from a shared/bookmarked URL
      const params = new URLSearchParams(window.location.search);
      query = params.get("q") ?? "";
      selectedTag = params.get("tag") ?? "";
      const sortParam = params.get("sort");
      if (sortParam === "oldest" || sortParam === "title") sort = sortParam;
      const pageParam = parseInt(params.get("page") ?? "1", 10);
      if (pageParam > 1) page = pageParam - 1;

      loaded = true;
      const staticListing = document.getElementById(staticListingId);
      if (staticListing) staticListing.hidden = true;
    } catch {
      // Leave the static listing in place
    }
  });

  // Tag list with article counts, derived from the index itself so counts are
  // article-only (fetchTopTags mixes in events and other content types)
  $: tagCounts = articles.reduce((acc, a) => {
    for (const tag of a.tags) acc.set(tag, (acc.get(tag) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  $: tagOptions = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

  $: filtered = articles.filter((a) => {
    if (selectedTag && !a.tags.includes(selectedTag)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  });

  $: sorted = [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    const cmp = new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
    return sort === "oldest" ? cmp : -cmp;
  });

  $: totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Clamp the page when the filtered set shrinks below the current page.
  $: if (page > totalPages - 1) page = totalPages - 1;
  $: pageArticles = sorted.slice(page * pageSize, page * pageSize + pageSize);

  // Keep filter state shareable without spamming history
  $: if (loaded && typeof window !== "undefined") {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedTag) params.set("tag", selectedTag);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 0) params.set("page", String(page + 1));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const handleFilterChange = (): void => {
    direction = 1;
    page = 0;
  };

  const goToPage = (target: number): void => {
    const next = target - 1;
    if (next === page || next < 0 || next > totalPages - 1) return;
    direction = next > page ? 1 : -1;
    page = next;
  };
</script>

{#if loaded}
  <div class="row mb-4 gy-2">
    <div class="col-lg-6">
      <label class="visually-hidden" for="articles-browser-query">Search articles</label>
      <input
        id="articles-browser-query"
        bind:value={query}
        on:input={handleFilterChange}
        class="form-control form-control-lg"
        type="text"
        placeholder="Search articles by title, description, or author"
      />
    </div>
    <div class="col-lg-3 col-sm-6">
      <label class="visually-hidden" for="articles-browser-tag">Filter by tag</label>
      <select
        id="articles-browser-tag"
        bind:value={selectedTag}
        on:change={handleFilterChange}
        class="form-select form-select-lg"
      >
        <option value="">All tags</option>
        {#each tagOptions as [tag, count]}
          <option value={tag}>{tag} ({count})</option>
        {/each}
      </select>
    </div>
    <div class="col-lg-3 col-sm-6">
      <label class="visually-hidden" for="articles-browser-sort">Sort articles</label>
      <select
        id="articles-browser-sort"
        bind:value={sort}
        on:change={handleFilterChange}
        class="form-select form-select-lg"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="title">By title</option>
      </select>
    </div>
  </div>

  <p class="text-muted" aria-live="polite">
    {sorted.length === articles.length
      ? `${articles.length} articles`
      : `${sorted.length} of ${articles.length} articles match`}
  </p>

  {#if sorted.length === 0}
    <p class="text-muted">No articles match your search.</p>
  {:else}
    <div class="articles-viewport">
      {#key page}
        <div
          class="row"
          in:fly={{ x: direction * SLIDE, duration: 300 }}
          out:fly={{ x: direction * -SLIDE, duration: 300 }}
        >
          {#each pageArticles as article (article.slug)}
            <div class="col-sm-6 mb-5">
              <ArticleCard {article} />
            </div>
          {/each}
        </div>
      {/key}
    </div>

    <div class="d-flex justify-content-center mt-2">
      <BrowserPagination currentPage={page + 1} {totalPages} onNavigate={goToPage} />
    </div>
  {/if}
{/if}

<style>
  /* Stack the outgoing and incoming pages in one grid cell so the fly
     transition reads as a horizontal swipe without a vertical jump. */
  .articles-viewport {
    display: grid;
    overflow-x: hidden;
  }
  .articles-viewport > :global(*) {
    grid-area: 1 / 1;
  }
</style>
