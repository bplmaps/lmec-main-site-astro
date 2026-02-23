<script lang="ts">
  type SearchStatus = "initial" | "searching" | "returned" | "failed";

  type SearchResult = {
    title: string;
    date: string;
    id: string;
    image: string;
    url: string;
  };

  type SearchRepository = {
    searchStatus: SearchStatus;
    results: SearchResult[];
    totalResults: number;
  };

  let searchInput = "";
  let enteredSearchInput = "";
  let searchType: "both" | "dc" | "ia" = "both";

  let digitalCollections: SearchRepository = {
    searchStatus: "initial",
    results: [],
    totalResults: 0
  };

  let internetArchive: SearchRepository = {
    searchStatus: "initial",
    results: [],
    totalResults: 0
  };

  $: searchAllowed =
    digitalCollections.searchStatus === "searching" ||
    internetArchive.searchStatus === "searching";
  $: resultsHidden =
    digitalCollections.searchStatus === "initial" &&
    internetArchive.searchStatus === "initial";

  const trimmer = (value: string): string => {
    if (value.length > 160) {
      return `${value.substring(0, 120)}...`;
    }
    return value;
  };

  const submitSearch = async (): Promise<void> => {
    enteredSearchInput = searchInput;
    digitalCollections = { ...digitalCollections, searchStatus: "searching", results: [] };
    internetArchive = { ...internetArchive, searchStatus: "searching", results: [] };

    fetch(`https://collections.leventhalmap.org/search.json?&per_page=3&q=${encodeURIComponent(searchInput)}`)
      .then((response) => response.json())
      .then((result) => {
        const docs = result?.data ?? [];
        const totalCount = result?.meta?.pages?.total_count ?? 0;
        const mappedResults: SearchResult[] = docs.map((r: any) => ({
          title: r?.attributes?.title_info_primary_tsi ?? "",
          date: r?.attributes?.date_tsim?.[0] ?? "",
          id: r?.id ?? "",
          image: `https://bpldcassets.blob.core.windows.net/derivatives/images/${r?.attributes?.exemplary_image_ssi}/image_thumbnail_300.jpg`,
          url: r?.links?.self ?? `https://collections.leventhalmap.org/search/${r?.id ?? ""}`
        }));

        digitalCollections = {
          searchStatus: "returned",
          totalResults: totalCount,
          results: mappedResults
        };
      })
      .catch(() => {
        digitalCollections = { searchStatus: "failed", results: [], totalResults: 0 };
      });

    fetch(`https://archive.org/advancedsearch.php?q=%28${encodeURIComponent(searchInput)}%29+AND+collection%3A%28normanbleventhalmapcenter%29&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=3&page=1&output=json&save=yes`)
      .then((response) => response.json())
      .then((result) => {
        const docs = result?.response?.docs ?? [];
        const totalCount = result?.response?.numFound ?? 0;
        const mappedResults: SearchResult[] = docs.map((r: any) => ({
          title: r.title ?? "",
          date: r.year ? String(r.year) : "",
          id: r.identifier,
          image: `https://archive.org/services/img/${r.identifier}`,
          url: `https://archive.org/details/${r.identifier}`
        }));

        internetArchive = {
          searchStatus: "returned",
          totalResults: totalCount,
          results: mappedResults
        };
      })
      .catch(() => {
        internetArchive = { searchStatus: "failed", results: [], totalResults: 0 };
      });
  };

  const goToResult = (url: string): void => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSearchInputKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      submitSearch();
    }
  };
</script>

<div class="container-fluid union-search py-5 px-3">
  <div class="mb-3">
    <input
      bind:value={searchInput}
      on:keydown={handleSearchInputKeydown}
      class="form-control form-control-lg"
      type="text"
      placeholder="Enter titles, creators, or subjects"
    />
  </div>

  <div class="row g-2 mb-4">
    <div class="col-md">
      <select name="search-type" bind:value={searchType} class="form-select">
        <option value="both">Search both repositories</option>
        <option value="dc">Digital Collections only</option>
        <option value="ia">Internet Archive only</option>
      </select>
    </div>
    <div class="col-md-auto">
      <button class="btn btn-primary w-100" type="button" disabled={searchAllowed} on:click={submitSearch}>
        Search
      </button>
    </div>
  </div>

  <div id="results" class={`bg-light px-4 py-4 ${resultsHidden ? "d-none" : ""}`}>
    {#if searchType === "both" || searchType === "dc"}
      <section class="mb-5">
        <div class={`mb-4 ${digitalCollections.searchStatus !== "searching" ? "d-none" : ""}`}>
          Loading Digital Collections repository results
          <div class="progress mt-2" role="progressbar" aria-label="Loading Digital Collections results" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
          </div>
        </div>

        <div id="dc-search-results" class={digitalCollections.searchStatus !== "returned" ? "d-none" : ""}>
          <h4 class="h4 mb-4">Results from Digital Collections repository</h4>
          <div class="row g-4">
            {#each digitalCollections.results as result (result.id)}
              <div class="col-12 col-md-6 col-xl-3">
                <button class="card result-card h-100 w-100 border-0 p-0 text-start" type="button" on:click={() => goToResult(result.url)}>
                  <div class="result-inner">
                    <div class="result-media">
                      <div class="ratio ratio-4x3">
                        <img class="w-100 h-100 result-image-cover" src={result.image} alt={`Thumbnail for ${result.title}`} />
                      </div>
                    </div>
                    <div class="card-body result-content">
                      <h5 class="card-title mb-1">{result.title}</h5>
                      <h6 class={`small text-muted mb-0 ${result.date === "" ? "d-none" : ""}`}>{result.date}</h6>
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
                      {digitalCollections.totalResults === 0
                        ? "No results"
                        : `${digitalCollections.totalResults.toLocaleString()} result${digitalCollections.totalResults === 1 ? "" : "s"}`}
                    </span>
                    from Digital Collections repository
                  </p>
                  <a
                    class={`btn btn-primary ${digitalCollections.totalResults === 0 ? "d-none" : ""}`}
                    href={`https://collections.leventhalmap.org/search?utf8=✓&q=${encodeURIComponent(enteredSearchInput)}`}
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
      </section>
    {/if}

    {#if searchType === "both" || searchType === "ia"}
      <section>
        <div class={`mb-4 ${internetArchive.searchStatus !== "searching" ? "d-none" : ""}`}>
          Loading Internet Archive results
          <div class="progress mt-2" role="progressbar" aria-label="Loading Internet Archive results" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar progress-bar-striped progress-bar-animated w-100"></div>
          </div>
        </div>

        <div id="ia-search-results" class={internetArchive.searchStatus !== "returned" ? "d-none" : ""}>
          <h4 class="h4 mb-4">Results from Internet Archive</h4>
          <div class="row g-4">
            {#each internetArchive.results as result (result.id)}
              <div class="col-12 col-md-6 col-xl-3">
                <button class="card result-card h-100 w-100 border-0 p-0 text-start" type="button" on:click={() => goToResult(result.url)}>
                  <div class="result-inner">
                    <div class="result-media">
                      <div class="ratio ratio-4x3">
                        <img class="w-100 h-100 result-image-contain" src={result.image} alt={`Thumbnail for ${result.title}`} />
                      </div>
                    </div>
                    <div class="card-body result-content">
                      <h5 class="card-title mb-1">{trimmer(result.title)}</h5>
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
                      {internetArchive.totalResults === 0
                        ? "No results"
                        : `${internetArchive.totalResults.toLocaleString()} result${internetArchive.totalResults === 1 ? "" : "s"}`}
                    </span>
                    results from Internet Archive
                  </p>
                  <a
                    class={`btn btn-primary ${internetArchive.totalResults === 0 ? "d-none" : ""}`}
                    href={`https://archive.org/search.php?query=%28${encodeURIComponent(enteredSearchInput)}%29%20AND%20collection%3A%28normanbleventhalmapcenter%29`}
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
      </section>
    {/if}
  </div>
</div>

<style>
  .union-search {
    background-color: rgb(248, 248, 248);
    box-shadow: inset 0 0 2px 0 rgba(0, 0, 0, 0.07);
  }

  .result-card {
    transition: background-color 0.25s ease-in-out;
  }

  .result-card:hover {
    background-color: rgba(204, 198, 226, 0.2);
  }

  .result-image-cover {
    object-fit: cover;
  }

  .result-image-contain {
    object-fit: contain;
  }

  .card-title {
    font-weight: 600;
    overflow: hidden;
  }

  .result-inner {
    display: flex;
    flex-direction: row;
  }

  .result-media {
    width: 25%;
    flex-shrink: 0;
  }

  .result-content {
    width: 75%;
    padding: 0.5rem;
  }

  @media (min-width: 768px) {
    .result-inner {
      display: block;
    }

    .result-media,
    .result-content {
      width: 100%;
    }

    .result-content {
      padding: 1rem;
    }
  }
</style>
