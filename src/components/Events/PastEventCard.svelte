<script lang="ts">
  import { lazyImage } from "./lazyImage";

  export type PastEvent = {
    name: string;
    slug: string;
    headerImage: { filename: string; alt: string } | null;
    eventDate: string;
    tags: string[];
  };

  export let event: PastEvent;
</script>

<div class="card border-0 rounded-0 hover-shadow">
  <div class="card-img position-relative">
    {#if event.headerImage && event.headerImage.filename}
      <img
        class="card-img-top rounded-0"
        data-src={event.headerImage.filename}
        alt={event.headerImage.alt}
        use:lazyImage
      />
    {/if}
    {#if event.eventDate}
      <div class="card-date">
        <span>{new Date(`${event.eventDate}Z`).getDate()}</span><br />
        {new Date(`${event.eventDate}Z`).toLocaleString("en-US", { month: "short" })}
      </div>
    {/if}
  </div>
  <div class="card-body">
    {#if event.name}
      <h3 class="h4 card-title">
        <a href={`/event/${event.slug}`}>
          {event.name}
        </a>
      </h3>
    {/if}
    {#if event.tags && event.tags.length}
      <ul class="d-flex flex-wrap p-0">
        {#each event.tags as tag}
          <li>
            <span class="badge rounded-pill bg-light text-secondary mb-1 tag-list">
              {tag}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .card-img-top {
    height: 175px;
    object-fit: cover;
    background: #eee;
  }
</style>
