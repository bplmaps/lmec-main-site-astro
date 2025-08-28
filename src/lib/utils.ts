import { date } from "astro:schema";
import { useStoryblokApi } from "@storyblok/astro";

const storyblokApi = useStoryblokApi()


export function createSlug (title: string) {
  return (
    title
      // remove leading & trailing whitespace
      .trim()
      // remove special characters
      .replace(/[^A-Za-z0-9 ]/g, '')
      // replace spaces
      .replace(/\s+/g, '-')
      // remove leading & trailing separtors
      .replace(/^-+|-+$/g, '')
      // output lowercase
      .toLowerCase()
  )
}

export function getPath (fullSlug: string) {
  return fullSlug.replace(/^main-site\//, '').replace(/\/$/, '');
}


export async function getDatasource(sourceID: string, sourceName: string) {
  const SB_DATA = String(import.meta.env.SB_DATA_TOKEN)

  const versionURL = `https://api-us.storyblok.com/v2/cdn/spaces/me?token=${SB_DATA}`
  const latestVersionObj = await fetch (versionURL)
    .then(response => {
      // console.log(response)
      return response.json();
    }).catch(error => { 
      console.log(error)
    })
  const currentVersion = latestVersionObj.space.version

  const dataEntriesURL = `https://api-us.storyblok.com/v2/cdn/datasource_entries?datasource=${sourceName}&token=${SB_DATA}&cv=${currentVersion}`
  const datasourceActuals = await fetch (dataEntriesURL)
    .then(response => {
      // console.log(response)
      return response.json();
    }).catch(error => { 
      console.log(error)
    })
  return datasourceActuals.datasource_entries
  console.log(datasourceActuals)
}

// Function to get the 4 most recent articles for article sidebar

export const fourRecentArticles = async () => {
  const sidebar_data = await storyblokApi.get('cdn/stories', {
    version: String(import.meta.env.STORYBLOK_IS_PREVIEW) == 'true' ? 'draft' : 'published',
    starts_with: 'main-site/',
    per_page: 4,
    content_type: 'article-page',
  })

  let four_articles = sidebar_data.data.stories
  four_articles = Object.values(four_articles)
  four_articles = four_articles.map((article: any) => {
    return {
      params: {
        name: article.name,
        slug: article.slug,
        headerImage: article.content.headerImage,
        publishDate: article.content.publishDate,
      },
    }
  })
  return four_articles;
};