<script lang="ts">
  import { lazyImage } from "../../lib/lazyImage";

  export type ArticleIndexEntry = {
    title: string;
    slug: string;
    description: string;
    author: string;
    publishDate: string;
    tags: string[];
    thumb: { src: string; alt: string } | null;
  };

  export let article: ArticleIndexEntry;
</script>

<!-- Mirrors the markup of src/components/Article/Card.astro so the hydrated
     browser is visually seamless with the static server-rendered listing. -->
<article class="card rounded-0 border-bottom border-primary border-top-0 border-left-0 border-right-0 hover-shadow">
  {#if article.thumb && article.thumb.src}
    <img
      class="card-img-top rounded-0"
      data-src={article.thumb.src}
      alt={article.thumb.alt}
      use:lazyImage
    />
  {/if}
  <div class="card-body">
    <ul class="list-inline mb-3">
      {#if article.publishDate}
        <li class="list-inline-item me-3 ms-0">
          {new Date(article.publishDate).toLocaleString("en-US", { dateStyle: "long" })}
        </li>
      {/if}
      {#if article.author}
        <li class="list-inline-item me-3 ms-0">
          {article.author}
        </li>
      {/if}
    </ul>
    {#if article.title}
      <h4 class="card-title">
        <a href={`/articles/${article.slug}`}>
          {article.title}
        </a>
      </h4>
    {/if}
    {#if article.description}
      <p class="card-text">
        {article.description}
      </p>
    {/if}
    <a href={`/articles/${article.slug}`} class="btn btn-primary btn-sm">
      Read more
    </a>
  </div>
</article>

<style>
  .card-img-top {
    background: #eee;
  }
</style>
