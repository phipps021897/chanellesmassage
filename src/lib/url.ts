/**
 * Prefixes a site-relative path (e.g. "/about/") with Astro's configured
 * `base` (e.g. "/chanellesmassage/"), which is required for internal links
 * and static asset references to resolve correctly when the site is
 * deployed under a subpath, as it is on GitHub Pages.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL; // always ends with "/"
  if (path === '/') return base;
  return `${base}${path.replace(/^\//, '')}`;
}
