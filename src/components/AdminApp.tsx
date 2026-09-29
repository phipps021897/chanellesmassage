import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabaseClient';
import LoginForm from './admin/LoginForm';
import BookingsTab from './admin/BookingsTab';
import ServicesTab from './admin/ServicesTab';
import AvailabilityTab from './admin/AvailabilityTab';

type Tab = 'bookings' | 'services' | 'availability';

export default function AdminApp() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('bookings');

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-brand-blush bg-brand-blush/20 p-6 text-brand-forest">
        Supabase is not configured yet. Set <code>PUBLIC_SUPABASE_URL</code> and{' '}
        <code>PUBLIC_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>) to enable the admin
        dashboard.
      </div>
    );
  }

  if (session === undefined) {
    return <p className="text-brand-ink/60">Loading…</p>;
  }

  if (session === null) {
    return <LoginForm supabase={supabase} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(
            [
              ['bookings', 'Bookings'],
              ['services', 'Services'],
              ['availability', 'Availability'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide ${
                tab === key ? 'bg-brand-forest text-brand-cream' : 'bg-brand-sage-light text-brand-forest'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm font-semibold text-brand-forest underline underline-offset-4"
        >
          Sign out
        </button>
      </div>

      {tab === 'bookings' && <BookingsTab supabase={supabase} />}
      {tab === 'services' && <ServicesTab supabase={supabase} />}
      {tab === 'availability' && <AvailabilityTab supabase={supabase} />}
    </div>
  );
}
