import { placeholderServices, type Service } from '../data/services';

/**
 * Runs at build time (Astro frontmatter executes on the server during
 * `astro build`). Tries to pull the live service list from Supabase so the
 * static Services page stays in sync with whatever Chanelle manages in the
 * admin dashboard. Falls back to the bundled placeholder list if Supabase
 * env vars aren't set yet, or the request fails for any reason — this keeps
 * the site buildable before Supabase has been configured.
 */
export async function getServicesForBuild(): Promise<Service[]> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return placeholderServices;
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/services?select=id,slug,name,description,duration_minutes,price_pence,is_active,sort_order&is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (!res.ok) return placeholderServices;

    const rows = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows) || rows.length === 0) return placeholderServices;

    return rows.map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description ?? ''),
      durationMinutes: Number(row.duration_minutes),
      pricePence: Number(row.price_pence),
      isActive: Boolean(row.is_active),
      sortOrder: Number(row.sort_order ?? 0),
    }));
  } catch {
    return placeholderServices;
  }
}
