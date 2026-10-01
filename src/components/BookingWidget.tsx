import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import {
  computeAvailableSlots,
  type BusinessHourRow,
  type BlockedSlotRow,
  type TakenSlotRow,
} from '../lib/availability';
import { placeholderServices, formatPrice, type Service } from '../data/services';

const DAYS_AHEAD = 21;

function toRowService(row: Record<string, unknown>): Service {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    durationMinutes: Number(row.duration_minutes),
    pricePence: Number(row.price_pence),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

type Step = 'service' | 'time' | 'details' | 'success';

export default function BookingWidget() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>(placeholderServices);
  const [businessHours, setBusinessHours] = useState<BusinessHourRow[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRow[]>([]);
  const [takenSlots, setTakenSlots] = useState<TakenSlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const days = useMemo(() => nextNDays(DAYS_AHEAD), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        setLoading(false);
        setLoadError(
          'Online booking is not fully set up yet — Supabase is not configured. Please call or email to book for now.'
        );
        return;
      }

      const rangeStart = new Date();
      const rangeEnd = new Date();
      rangeEnd.setDate(rangeEnd.getDate() + DAYS_AHEAD);

      const [servicesRes, hoursRes, blockedRes, takenRes] = await Promise.all([
        supabase
          .from('services')
          .select('id, slug, name, description, duration_minutes, price_pence, is_active, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase.from('business_hours').select('day_of_week, start_time, end_time, is_closed'),
        supabase
          .from('blocked_slots')
          .select('start_at, end_at')
          .lte('start_at', rangeEnd.toISOString())
          .gte('end_at', rangeStart.toISOString()),
        supabase
          .from('taken_slots')
          .select('service_id, start_at, end_at, status')
          .gte('start_at', rangeStart.toISOString())
          .lte('start_at', rangeEnd.toISOString()),
      ]);

      if (cancelled) return;

      if (servicesRes.error || hoursRes.error || blockedRes.error || takenRes.error) {
        setLoadError('Something went wrong loading availability. Please try again shortly, or call/email to book.');
        setLoading(false);
        return;
      }

      if (servicesRes.data && servicesRes.data.length > 0) {
        setServices(servicesRes.data.map(toRowService));
      }
      setBusinessHours((hoursRes.data ?? []) as BusinessHourRow[]);
      setBlockedSlots((blockedRes.data ?? []) as BlockedSlotRow[]);
      setTakenSlots((takenRes.data ?? []) as TakenSlotRow[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Any existing booking (regardless of which service it's for) blocks that
  // time slot — Chanelle can only do one treatment at once.
  const slotsByDate = useMemo(() => {
    if (!selectedService) return new Map<string, Date[]>();
    const map = new Map<string, Date[]>();
    for (const day of days) {
      const slots = computeAvailableSlots({
        date: day,
        durationMinutes: selectedService.durationMinutes,
        businessHours,
        blockedSlots,
        takenSlots,
      });
      map.set(dateKey(day), slots);
    }
    return map;
  }, [selectedService, businessHours, blockedSlots, takenSlots, days]);

  const availableSlotsForSelectedDate = selectedDate ? (slotsByDate.get(dateKey(selectedDate)) ?? []) : [];

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep('time');
  }

  function handleSelectSlot(slot: Date) {
    setSelectedSlot(slot);
    setStep('details');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !selectedService || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    const endAt = new Date(selectedSlot.getTime() + selectedService.durationMinutes * 60_000);

    const { error } = await supabase.from('bookings').insert({
      service_id: selectedService.id,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),
      start_at: selectedSlot.toISOString(),
      end_at: endAt.toISOString(),
      status: 'pending',
      notes: notes.trim(),
    });

    setSubmitting(false);

    if (error) {
      setSubmitError('Sorry, we could not submit your booking. Please try again or call/email directly.');
      return;
    }

    setStep('success');
  }

  if (loading) {
    return <p className="text-brand-ink/60">Loading availability&hellip;</p>;
  }

  if (loadError && step !== 'success') {
    return (
      <div className="rounded-2xl border border-brand-blush bg-brand-blush/20 p-6 text-brand-forest">
        {loadError}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-brand-sage/30 bg-brand-sage-light p-6 shadow-sm sm:p-10">
      <ol className="mb-8 flex flex-wrap gap-2 text-xs font-semibold tracking-wide text-brand-ink/50 uppercase">
        <li className={step === 'service' ? 'text-brand-forest' : ''}>1. Service</li>
        <span>&rarr;</span>
        <li className={step === 'time' ? 'text-brand-forest' : ''}>2. Time</li>
        <span>&rarr;</span>
        <li className={step === 'details' ? 'text-brand-forest' : ''}>3. Your details</li>
        <span>&rarr;</span>
        <li className={step === 'success' ? 'text-brand-forest' : ''}>4. Confirmation</li>
      </ol>

      {step === 'service' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelectService(service)}
              className="rounded-2xl border border-brand-sage/30 p-5 text-left transition hover:border-brand-forest hover:shadow-md"
            >
              <p className="font-display text-lg font-semibold text-brand-forest">{service.name}</p>
              <p className="mt-1 text-sm text-brand-ink/60">{service.description}</p>
              <p className="mt-3 text-sm font-semibold text-brand-gold">
                {formatPrice(service.pricePence)} &middot; {service.durationMinutes} min
              </p>
            </button>
          ))}
        </div>
      )}

      {step === 'time' && selectedService && (
        <div>
          <button
            type="button"
            onClick={() => setStep('service')}
            className="mb-4 text-sm font-semibold text-brand-forest underline underline-offset-4"
          >
            &larr; Change service
          </button>
          <p className="mb-4 text-sm text-brand-ink/70">
            Booking: <strong>{selectedService.name}</strong> ({selectedService.durationMinutes} min)
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => {
              const key = dateKey(day);
              const hasSlots = (slotsByDate.get(key) ?? []).length > 0;
              const isSelected = selectedDate && dateKey(selectedDate) === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!hasSlots}
                  onClick={() => {
                    setSelectedDate(day);
                    setSelectedSlot(null);
                  }}
                  className={[
                    'flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 text-xs',
                    isSelected
                      ? 'border-brand-forest bg-brand-forest text-brand-cream'
                      : hasSlots
                        ? 'border-brand-sage/40 text-brand-ink hover:border-brand-forest'
                        : 'cursor-not-allowed border-brand-sage/10 text-brand-ink/30',
                  ].join(' ')}
                >
                  <span className="font-semibold">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span>{day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-6">
              {availableSlotsForSelectedDate.length === 0 ? (
                <p className="text-sm text-brand-ink/60">No times available this day — try another date.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlotsForSelectedDate.map((slot) => (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className="rounded-full border border-brand-sage/40 px-4 py-2 text-sm font-medium text-brand-forest hover:border-brand-forest hover:bg-brand-forest hover:text-brand-cream"
                    >
                      {slot.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'details' && selectedService && selectedSlot && (
        <form onSubmit={handleSubmit}>
          <button
            type="button"
            onClick={() => setStep('time')}
            className="mb-4 text-sm font-semibold text-brand-forest underline underline-offset-4"
          >
            &larr; Change time
          </button>

          <div className="mb-6 rounded-xl bg-brand-sage-light/40 p-4 text-sm text-brand-ink/80">
            <strong>{selectedService.name}</strong> &middot;{' '}
            {selectedSlot.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            at {selectedSlot.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-brand-ink">Full name</span>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-sage/40 px-3 py-2 focus:border-brand-forest focus:ring-brand-forest focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-brand-ink">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-sage/40 px-3 py-2 focus:border-brand-forest focus:ring-brand-forest focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-brand-ink">Phone</span>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-sage/40 px-3 py-2 focus:border-brand-forest focus:ring-brand-forest focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-brand-ink">Anything we should know? (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-brand-sage/40 px-3 py-2 focus:border-brand-forest focus:ring-brand-forest focus:outline-none"
              />
            </label>
          </div>

          {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-brand-forest px-7 py-3 text-sm font-semibold tracking-wide text-brand-cream uppercase hover:bg-brand-forest-dark disabled:opacity-60"
          >
            {submitting ? 'Sending request…' : 'Request booking'}
          </button>
          <p className="mt-3 text-center text-xs text-brand-ink/50">
            This sends a booking request — Chanelle will confirm it's all set by phone or email.
          </p>
        </form>
      )}

      {step === 'success' && (
        <div className="py-8 text-center">
          <p className="font-display text-2xl font-semibold text-brand-forest">Request sent!</p>
          <p className="mx-auto mt-3 max-w-sm text-brand-ink/70">
            Thanks {name || 'there'} — your booking request has been received. You'll hear back to
            confirm your appointment shortly.
          </p>
        </div>
      )}
    </div>
  );
}
