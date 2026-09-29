// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Deployed to GitHub Pages at https://phipps021897.github.io/chanellesmassage/
// If a custom domain is later attached, change `base` to '/' and update `site` to the custom domain.
const SITE_URL = 'https://phipps021897.github.io';
const BASE_PATH = '/chanellesmassage';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
