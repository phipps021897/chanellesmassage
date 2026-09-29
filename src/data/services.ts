export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  pricePence: number;
  isActive: boolean;
  sortOrder: number;
}

// Fallback content used for the static Services page (and as sample data for
// Supabase) until the real price list is confirmed. Once Supabase is
// connected, `src/lib/services.server.ts` fetches the live list at build
// time and this fallback is only used if that fetch fails or hasn't been
// configured yet. TODO: confirm real service names, durations and prices.
export const placeholderServices: Service[] = [
  {
    id: 'placeholder-swedish-60',
    slug: 'relaxation-massage-60',
    name: 'Relaxation (Swedish) Massage — 60 min',
    description:
      'A gentle, flowing full-body massage designed to ease tension, calm the nervous system and leave you feeling restored.',
    durationMinutes: 60,
    pricePence: 5500,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'placeholder-deep-tissue-60',
    slug: 'deep-tissue-massage-60',
    name: 'Deep Tissue Massage — 60 min',
    description:
      'Firmer pressure targeting chronic muscle tension and knots, ideal if you carry stress in your shoulders, neck or back.',
    durationMinutes: 60,
    pricePence: 6000,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'placeholder-back-neck-shoulder-30',
    slug: 'back-neck-shoulder-30',
    name: 'Back, Neck & Shoulder Massage — 30 min',
    description:
      'A focused treatment on the areas that hold the most tension — perfect for a lunch break reset.',
    durationMinutes: 30,
    pricePence: 3500,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'placeholder-sports-90',
    slug: 'sports-massage-90',
    name: 'Sports Massage — 90 min',
    description:
      'A deeper, targeted treatment for active clients — supports recovery, mobility and injury prevention.',
    durationMinutes: 90,
    pricePence: 8000,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'placeholder-hot-stone-75',
    slug: 'hot-stone-massage-75',
    name: 'Hot Stone Massage — 75 min',
    description:
      'Warmed basalt stones combined with massage strokes to melt away tension and deeply relax the body.',
    durationMinutes: 75,
    pricePence: 7000,
    isActive: true,
    sortOrder: 5,
  },
];

export function formatPrice(pricePence: number): string {
  return `£${(pricePence / 100).toFixed(2)}`;
}
