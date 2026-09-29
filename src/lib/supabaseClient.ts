import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let missingConfigWarned = false;

/**
 * Lazily creates a single shared Supabase client for browser-side use
 * (booking form + admin dashboard). Returns null if the site hasn't been
 * configured with Supabase credentials yet (see .env.example) so callers
 * can show a friendly "not configured" message instead of crashing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) {
    if (!missingConfigWarned) {
      console.warn(
        '[chanellesmassage] Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (see .env.example).'
      );
      missingConfigWarned = true;
    }
    return null;
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}
