import { useEffect, useState, useCallback, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatPrice } from '../../data/services';

interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_pence: number;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: '',
  sort_order: 0,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ServicesTab({ supabase }: { supabase: SupabaseClient }) {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
    if (error) setError('Could not load services.');
    else setServices((data ?? []) as ServiceRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(service: ServiceRow) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);
    if (!error) load();
  }

  async function updateField(service: ServiceRow, field: 'price_pence' | 'duration_minutes', value: number) {
    const { error } = await supabase.from('services').update({ [field]: value }).eq('id', service.id);
    if (!error) load();
  }

  async function deleteService(id: string) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) load();
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const pricePence = Math.round(Number(form.price) * 100);
    if (!form.name.trim() || Number.isNaN(pricePence) || pricePence <= 0) {
      setError('Please enter a valid name and price.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('services').insert({
      slug: `${slugify(form.name)}-${form.duration_minutes}`,
      name: form.name.trim(),
      description: form.description.trim(),
      duration_minutes: form.duration_minutes,
      price_pence: pricePence,
      sort_order: form.sort_order,
      is_active: true,
    });

    setSaving(false);
    if (error) {
      setError('Could not add service — check the slug is unique.');
      return;
    }
    setForm(emptyForm);
    load();
  }

  return (
    <div>
      {loading && <p className="text-sm text-brand-ink/60">Loading…</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid gap-3">
        {services.map((s) => (
          <div key={s.id} className="rounded-xl border border-brand-sage/30 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-forest">{s.name}</p>
                <p className="text-sm text-brand-ink/60">{s.description}</p>
              </div>
              <button
                onClick={() => toggleActive(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {s.is_active ? 'Active' : 'Hidden'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-1">
                Price £
                <input
                  type="number"
                  step="0.01"
                  defaultValue={(s.price_pence / 100).toFixed(2)}
                  onBlur={(e) => updateField(s, 'price_pence', Math.round(Number(e.target.value) * 100))}
                  className="w-20 rounded border border-brand-sage/40 px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-1">
                Minutes
                <input
                  type="number"
                  step="5"
                  defaultValue={s.duration_minutes}
                  onBlur={(e) => updateField(s, 'duration_minutes', Number(e.target.value))}
                  className="w-16 rounded border border-brand-sage/40 px-2 py-1"
                />
              </label>
              <span className="text-brand-ink/50">Currently {formatPrice(s.price_pence)}</span>
              <button
                onClick={() => deleteService(s.id)}
                className="ml-auto text-xs font-semibold text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mt-8 rounded-xl border border-dashed border-brand-sage/50 p-4">
        <p className="mb-3 text-sm font-semibold text-brand-forest">Add a new service</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded border border-brand-sage/40 px-3 py-2 sm:col-span-2"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded border border-brand-sage/40 px-3 py-2 sm:col-span-2"
          />
          <input
            type="number"
            step="5"
            placeholder="Duration (minutes)"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
            className="rounded border border-brand-sage/40 px-3 py-2"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price (£)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded border border-brand-sage/40 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-full bg-brand-forest px-5 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-forest-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Add service'}
        </button>
      </form>
    </div>
  );
}
