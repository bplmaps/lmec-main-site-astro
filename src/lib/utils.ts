import { date } from "astro:schema";

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