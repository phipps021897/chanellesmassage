import { useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatPrice } from '../../data/services';

interface BookingRow {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  services: { name: string; price_pence: number } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-200 text-slate-700',
};

type Filter = 'upcoming' | 'pending' | 'all';

export default function BookingsTab({ supabase }: { supabase: SupabaseClient }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('upcoming');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('bookings')
      .select(
        'id, service_id, customer_name, customer_email, customer_phone, start_at, end_at, status, notes, services ( name, price_pence )'
      )
      .order('start_at', { ascending: true });

    if (filter === 'upcoming') {
      query = query.gte('start_at', new Date().toISOString()).neq('status', 'cancelled');
    } else if (filter === 'pending') {
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;

    if (error) {
      setError('Could not load bookings.');
    } else {
      setBookings((data ?? []) as unknown as BookingRow[]);
    }
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: BookingRow['status']) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) load();
  }

  async function deleteBooking(id: string) {
    if (!confirm('Delete this booking permanently?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(['upcoming', 'pending', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase ${
              filter === f ? 'bg-brand-forest text-brand-cream' : 'bg-brand-sage-light text-brand-forest'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-brand-ink/60">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && bookings.length === 0 && (
        <p className="text-sm text-brand-ink/60">No bookings to show.</p>
      )}

      <div className="grid gap-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-xl border border-brand-sage/30 bg-brand-sage-light p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-brand-forest">
                  {b.services?.name ?? 'Service'}{' '}
                  {b.services && (
                    <span className="font-normal text-brand-ink/50">
                      ({formatPrice(b.services.price_pence)})
                    </span>
                  )}
                </p>
                <p className="text-sm text-brand-ink/70">
                  {new Date(b.start_at).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[b.status]}`}>
                {b.status}
              </span>
            </div>

            <div className="mt-3 text-sm text-brand-ink/80">
              <p>{b.customer_name}</p>
              <p>
                <a href={`tel:${b.customer_phone}`} className="underline underline-offset-2">
                  {b.customer_phone}
                </a>{' '}
                &middot;{' '}
                <a href={`mailto:${b.customer_email}`} className="underline underline-offset-2">
                  {b.customer_email}
                </a>
              </p>
              {b.notes && <p className="mt-1 italic text-brand-ink/60">"{b.notes}"</p>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {b.status !== 'confirmed' && (
                <button
                  onClick={() => updateStatus(b.id, 'confirmed')}
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Confirm
                </button>
              )}
              {b.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(b.id, 'completed')}
                  className="rounded-full bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Mark completed
                </button>
              )}
              {b.status !== 'cancelled' && (
                <button
                  onClick={() => updateStatus(b.id, 'cancelled')}
                  className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => deleteBooking(b.id)}
                className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
