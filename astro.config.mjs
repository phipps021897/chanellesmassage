// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Served from the custom domain (see public/CNAME) at its root, rather than
// the default https://phipps021897.github.io/chanellesmassage/ subpath.
const SITE_URL = 'https://www.chanellesmassage.co.uk';
const BASE_PATH = '/';

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
