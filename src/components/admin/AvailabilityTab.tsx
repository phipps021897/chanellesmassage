import { useEffect, useState, useCallback, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BIWEEKLY_ANCHOR_DATE } from '../../lib/biweekly';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface HourRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

interface BiweeklyHourRow extends HourRow {
  week_number: 1 | 2;
}

interface BlockedRow {
  id: string;
  start_at: string;
  end_at: string;
  reason: string;
}

const anchorDisplay = new Date(`${BIWEEKLY_ANCHOR_DATE}T00:00:00`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function HoursEditor<T extends HourRow>({
  rows,
  onSave,
}: {
  rows: T[];
  onSave: (row: T, patch: Partial<HourRow>) => void;
}) {
  const sorted = [...rows].sort((a, b) => a.day_of_week - b.day_of_week);
  return (
    <div className="grid gap-2">
      {sorted.map((row) => (
        <div
          key={row.day_of_week}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-sage/30 bg-brand-sage-light p-3"
        >
          <span className="w-24 font-medium">{DAY_NAMES[row.day_of_week]}</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!row.is_closed}
              onChange={(e) => onSave(row, { is_closed: !e.target.checked })}
            />
            Open
          </label>
          {!row.is_closed && (
            <>
              <input
                type="time"
                defaultValue={row.start_time.slice(0, 5)}
                onBlur={(e) => onSave(row, { start_time: e.target.value })}
                className="rounded border border-brand-sage/40 px-2 py-1"
              />
              <span>&ndash;</span>
              <input
                type="time"
                defaultValue={row.end_time.slice(0, 5)}
                onBlur={(e) => onSave(row, { end_time: e.target.value })}
                className="rounded border border-brand-sage/40 px-2 py-1"
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AvailabilityTab({ supabase }: { supabase: SupabaseClient }) {
  const [legacyHours, setLegacyHours] = useState<HourRow[]>([]);
  const [biweeklyHours, setBiweeklyHours] = useState<BiweeklyHourRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState({ start: '', end: '', reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const [legacyRes, biweeklyRes, blockedRes] = await Promise.all([
      supabase.from('business_hours').select('*').order('day_of_week', { ascending: true }),
      supabase.from('biweekly_hours').select('*').order('week_number', { ascending: true }),
      supabase.from('blocked_slots').select('*').order('start_at', { ascending: true }),
    ]);
    if (legacyRes.error || blockedRes.error) {
      setError('Could not load availability.');
    }
    if (biweeklyRes.error) {
      setError('Week 1 / Week 2 tables not found — run the latest supabase/schema.sql to add them.');
    }
    setLegacyHours((legacyRes.data ?? []) as HourRow[]);
    setBiweeklyHours((biweeklyRes.data ?? []) as BiweeklyHourRow[]);
    setBlocked((blockedRes.data ?? []) as BlockedRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveLegacyHour(row: HourRow, patch: Partial<HourRow>) {
    const { error } = await supabase
      .from('business_hours')
      .update({ ...patch })
      .eq('day_of_week', row.day_of_week);
    if (!error) load();
  }

  async function saveBiweeklyHour(row: BiweeklyHourRow, patch: Partial<HourRow>) {
    const { error } = await supabase
      .from('biweekly_hours')
      .update({ ...patch })
      .eq('day_of_week', row.day_of_week)
      .eq('week_number', row.week_number);
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
        <h2 className="font-display text-xl font-semibold text-brand-forest">
          Current hours (new schedule begins {anchorDisplay})
        </h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          The old single-week schedule — still in effect for any booking before the new
          alternating schedule starts below.
        </p>
        <div className="mt-3">
          <HoursEditor rows={legacyHours} onSave={saveLegacyHour} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-brand-forest">
          Week 1 (from {anchorDisplay})
        </h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Applies the week of {anchorDisplay}, then alternates with Week 2 every other week.
        </p>
        <div className="mt-3">
          <HoursEditor
            rows={biweeklyHours.filter((h) => h.week_number === 1)}
            onSave={saveBiweeklyHour}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-brand-forest">Week 2</h2>
        <p className="mt-1 text-sm text-brand-ink/60">Applies the week after each Week 1.</p>
        <div className="mt-3">
          <HoursEditor
            rows={biweeklyHours.filter((h) => h.week_number === 2)}
            onSave={saveBiweeklyHour}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-brand-forest">Time off / blocked dates</h2>
        <div className="mt-3 grid gap-2">
          {blocked.length === 0 && <p className="text-sm text-brand-ink/60">No time off scheduled.</p>}
          {blocked.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-sage/30 bg-brand-sage-light p-3 text-sm"
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
