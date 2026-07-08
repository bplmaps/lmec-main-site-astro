<script lang="ts">
  // Client-side counterpart of src/components/Pagination.astro: same ARIA
  // pattern and .pagination styling, but <button> elements driving a callback
  // instead of links to static pages.
  export let currentPage: number; // 1-based
  export let totalPages: number;
  export let maxPagesToShow = 5;
  export let onNavigate: (page: number) => void;

  $: startPage = (() => {
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const end = Math.min(totalPages, start + maxPagesToShow - 1);
    return Math.max(1, end - maxPagesToShow + 1);
  })();
  $: endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  $: pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
</script>

{#if totalPages > 1}
  <ul class="pagination pagination-default" aria-label="Pagination">
    <li class={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
      <button
        type="button"
        class="page-link"
        aria-label="First"
        disabled={currentPage === 1}
        on:click={() => onNavigate(1)}><span aria-hidden="true">««</span></button>
    </li>
    <li class={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
      <button
        type="button"
        class="page-link"
        aria-label="Previous"
        disabled={currentPage === 1}
        on:click={() => onNavigate(currentPage - 1)}><span aria-hidden="true">«</span></button>
    </li>
    {#each pages as page}
      <li class={`page-item ${currentPage === page ? "active" : ""}`}>
        <button
          type="button"
          class="page-link"
          aria-label={`Page ${page}`}
          aria-current={currentPage === page ? "page" : undefined}
          on:click={() => onNavigate(page)}>{page}</button>
      </li>
    {/each}
    <li class={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
      <button
        type="button"
        class="page-link"
        aria-label="Next"
        disabled={currentPage === totalPages}
        on:click={() => onNavigate(currentPage + 1)}><span aria-hidden="true">»</span></button>
    </li>
    <li class={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
      <button
        type="button"
        class="page-link"
        aria-label="Last"
        disabled={currentPage === totalPages}
        on:click={() => onNavigate(totalPages)}><span aria-hidden="true">»»</span></button>
    </li>
  </ul>
{/if}
