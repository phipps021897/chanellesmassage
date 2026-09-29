import { useEffect, useState, useCallback, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface HourRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

interface BlockedRow {
  id: string;
  start_at: string;
  end_at: string;
  reason: string;
}

export default function AvailabilityTab({ supabase }: { supabase: SupabaseClient }) {
  const [hours, setHours] = useState<HourRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState({ start: '', end: '', reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const [hoursRes, blockedRes] = await Promise.all([
      supabase.from('business_hours').select('*').order('day_of_week', { ascending: true }),
      supabase.from('blocked_slots').select('*').order('start_at', { ascending: true }),
    ]);
    if (hoursRes.error || blockedRes.error) setError('Could not load availability.');
    setHours((hoursRes.data ?? []) as HourRow[]);
    setBlocked((blockedRes.data ?? []) as BlockedRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveHour(row: HourRow, patch: Partial<HourRow>) {
    const { error } = await supabase
      .from('business_hours')
      .update({ ...patch })
      .eq('day_of_week', row.day_of_week);
    if (!error) load();
  }

  async function addBlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!blockForm.start || !blockForm.end) return;

    const { error } = await supabase.from('blocked_slots').insert({
      start_at: new Date(blockForm.start).toISOString(),
      end_at: new Date(blockForm.end).toISOString(),
      reason: blockForm.reason.trim(),
    });

    if (!error) {
      setBlockForm({ start: '', end: '', reason: '' });
      load();
    }
  }

  async function removeBlock(id: string) {
    const { error } = await supabase.from('blocked_slots').delete().eq('id', id);
    if (!error) load();
  }

  if (loading) return <p className="text-sm text-brand-ink/60">Loading…</p>;

  return (
    <div className="grid gap-10">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="font-display text-xl font-semibold text-brand-forest">Weekly hours</h2>
        <div className="mt-3 grid gap-2">
          {hours.map((row) => (
            <div
              key={row.day_of_week}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-sage/30 bg-white p-3"
            >
              <span className="w-24 font-medium">{DAY_NAMES[row.day_of_week]}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!row.is_closed}
                  onChange={(e) => saveHour(row, { is_closed: !e.target.checked })}
                />
                Open
              </label>
              {!row.is_closed && (
                <>
                  <input
                    type="time"
                    defaultValue={row.start_time.slice(0, 5)}
                    onBlur={(e) => saveHour(row, { start_time: e.target.value })}
                    className="rounded border border-brand-sage/40 px-2 py-1"
                  />
                  <span>&ndash;</span>
                  <input
                    type="time"
                    defaultValue={row.end_time.slice(0, 5)}
                    onBlur={(e) => saveHour(row, { end_time: e.target.value })}
                    className="rounded border border-brand-sage/40 px-2 py-1"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-brand-forest">Time off / blocked dates</h2>
        <div className="mt-3 grid gap-2">
          {blocked.length === 0 && <p className="text-sm text-brand-ink/60">No time off scheduled.</p>}
          {blocked.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-sage/30 bg-white p-3 text-sm"
            >
              <span>
                {new Date(b.start_at).toLocaleString('en-GB')} &rarr; {new Date(b.end_at).toLocaleString('en-GB')}
                {b.reason && <span className="text-brand-ink/50"> — {b.reason}</span>}
              </span>
              <button
                onClick={() => removeBlock(b.id)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addBlock} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-brand-sage/50 p-4">
          <label className="text-sm">
            From
            <input
              required
              type="datetime-local"
              value={blockForm.start}
              onChange={(e) => setBlockForm({ ...blockForm, start: e.target.value })}
              className="mt-1 block rounded border border-brand-sage/40 px-2 py-1"
            />
          </label>
          <label className="text-sm">
            To
            <input
              required
              type="datetime-local"
              value={blockForm.end}
              onChange={(e) => setBlockForm({ ...blockForm, end: e.target.value })}
              className="mt-1 block rounded border border-brand-sage/40 px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Reason
            <input
              type="text"
              placeholder="Holiday, personal, etc."
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              className="mt-1 block rounded border border-brand-sage/40 px-2 py-1"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand-forest px-5 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-forest-dark"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
