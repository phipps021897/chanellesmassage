export interface Coordinates {
  lat: number;
  lon: number;
}

// Confirmed via OpenStreetMap Nominatim for DT4 9UX (Granby Industrial Estate,
// Weymouth/Chickerell, Dorset) at build time on 2026-10-01. Used if the live
// lookup below fails or is skipped (e.g. offline build), so the map always
// has a sensible location rather than failing the build.
const FALLBACK_COORDINATES: Coordinates = { lat: 50.6169247, lon: -2.4896776 };

/**
 * Runs at build time (Astro frontmatter executes on the server during
 * `astro build`). Geocodes the business address via OpenStreetMap's free
 * Nominatim API so the Location page map stays accurate if the address ever
 * changes, without needing an API key. Nominatim's usage policy allows light,
 * infrequent use like this (one request per deploy) — see
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export async function getCoordinatesForAddress(query: string): Promise<Coordinates> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=gb`,
      {
        headers: {
          'User-Agent': 'chanellesmassage-site-build/1.0 (build-time map geocode)',
        },
      }
    );

    if (!res.ok) return FALLBACK_COORDINATES;

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(results) || results.length === 0) return FALLBACK_COORDINATES;

    const { lat, lon } = results[0];
    return { lat: Number(lat), lon: Number(lon) };
  } catch {
    return FALLBACK_COORDINATES;
  }
}
