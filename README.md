# LMEC Main Site Astro Rebuild

This repository contains the code for the Astro-based LMEC website. Content on this site comes from Storyblok as the CMS.

## Local Development
To work on this site locally, you will need to make a `.env` file that contains values for the variables in the `.env.example` file. You can get these values from the proper staff administrator.

Clone the repository to your local machine and first run `npm install` in the directory where the project downloads.

Once all packages have been installed and environment variables have been provided, running `npm run dev` will run the local version of the site. (You will be able to see draft version of content from Storyblok if the environment variables are configured correctly.) 

## Staging Site Build Chain
At present, the staging site builds at https://lmec-main-site-astro-staging.netlify.app. The staging site shows *both* published and draft content from the Storyblok CMS. 

The site will rebuild upon one of two things happening: 
- 1) Commits to the `main` branch (whether directly or via a merged PR)
- 2) An editor within Storyblok publishes a piece of content

Settings for the staging site build chain can be found within the relelvant property in the LMEC Netlify account. 

## Production Build Chain
The production build chain is a multistep process, but runs roughly as follows:
* There is a cron job that runs every 2 hours to rebuild the site on the `geoservices` server. This cron job will run a bash script called `refresh-lmec-main-site-astro.sh`.
* The refresh script pulls down the most current version of the `main` branch of this repository into `site-build-repos/lmec-main-site-astro`. Once the build is finished, it copies the contents of the fully-built `dist` folder to `/var/www/main-site/` and runs a bash script that creates symlinks for a variety of LMEC digital properties that need to "live" at a `leventhalmap.org/...` domain. The symlinks are created based on the contents of `public/other-properties-manifest.yaml` in this repository.

## Special Notes
* Any time a new digital exhibition, Map Chat, or other digital project that will require a `leventhalmap.org/...` domain is ready to be deployed, an additional entry will be required in the `public/other-properties-manifest.yaml` file and the proper files will need to placed in the relevant locations within `var/www/other-properties`

