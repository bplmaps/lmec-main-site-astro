<script lang="ts">
  type SearchStatus = "initial" | "searching" | "returned" | "failed";

  type SearchResult = {
    title: string;
    date: string;
    id: string;
    image: string;
    url: string;
  };

  export let id: string;
  export let heading: string;
  export let loadingLabel: string;
  export let loadingAriaLabel: string;
  export let searchStatus: SearchStatus;
  export let results: SearchResult[] = [];
  export let totalResults: number;
  export let badgeSuffix: string;
  export let seeAllHref: string;
  export let trimTitle = false;
  export let goToResult: (url: string) => void;

  const trimmer = (value: string): string => {
    if (value.length > 160) {
      return `${value.substring(0, 120)}...`;
    }
    return value;
  };
</script>

<style>
  .result-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

<div class={`mb-4 ${searchStatus !== "searching" ? "d-none" : ""}`}>
  {loadingLabel}
  <div
    class="progress mt-2"
    role="progressbar"
    aria-label={loadingAriaLabel}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
  </div>
</div>

<div id={id} class={searchStatus !== "returned" ? "d-none" : ""}>
  <h4 class="h4 mb-4">{heading}</h4>
  <div class="row g-4">
    {#each results as result (result.id)}
      <div class="col-12 col-md-6 col-xl-3">
        <button
          class="card result-card h-100 w-100 border-0 p-0 text-start"
          type="button"
          on:click={() => goToResult(result.url)}
        >
          <div class="result-inner w-100">
            <div class="result-media">
              <div class="ratio ratio-4x3">
                <img
                  class="w-100 h-100 result-image"
                  src={result.image}
                  alt={`Thumbnail for ${result.title}`}
                />
              </div>
            </div>
            <div class="card-body result-content">
              <h5 class="card-title mb-1">{trimTitle ? trimmer(result.title) : result.title}</h5>
              <h6 class={`small text-muted mb-0 ${!result.date ? "d-none" : ""}`}>{result.date}</h6>
            </div>
          </div>
        </button>
      </div>
    {/each}

    <div class="col-12 col-md-6 col-xl-3">
      <div class="card h-100">
        <div class="card-body">
          <p class="mb-2">
            <span class="badge bg-secondary fs-6 align-middle me-2">
              {totalResults === 0
                ? "No results"
                : `${totalResults.toLocaleString()} result${totalResults === 1 ? "" : "s"}`}
            </span>
            {badgeSuffix}
          </p>
          <a
            class={`btn btn-primary ${totalResults === 0 ? "d-none" : ""}`}
            href={seeAllHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            See all
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

