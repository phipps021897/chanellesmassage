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
// configured yet.
export const placeholderServices: Service[] = [
  {
    id: 'placeholder-sports-30',
    slug: 'sports-massage-30',
    name: 'Sports Massage — 30 min',
    description:
      'A focused sports massage session to ease muscle tension, support recovery and improve mobility.',
    durationMinutes: 30,
    pricePence: 2500,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'placeholder-sports-60',
    slug: 'sports-massage-60',
    name: 'Sports Massage — 60 min',
    description:
      'A full sports massage treatment for deeper, more thorough work on problem areas and recovery.',
    durationMinutes: 60,
    pricePence: 4500,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'placeholder-sports-consult-30',
    slug: 'sports-massage-consultation-30',
    name: 'Sports Massage & Consultation — 30 min',
    description:
      'Includes a consultation to assess your needs and goals alongside a 30-minute sports massage — ideal for a first visit.',
    durationMinutes: 30,
    pricePence: 3000,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'placeholder-sports-consult-60',
    slug: 'sports-massage-consultation-60',
    name: 'Sports Massage & Consultation — 60 min',
    description:
      'A full consultation plus a 60-minute sports massage treatment, tailored to your training or recovery needs.',
    durationMinutes: 60,
    pricePence: 5000,
    isActive: true,
    sortOrder: 4,
  },
];

export function formatPrice(pricePence: number): string {
  return `£${(pricePence / 100).toFixed(2)}`;
}

export interface SessionCard {
  id: string;
  name: string;
  durationMinutes: number;
  sessionCount: number;
  pricePence: number;
}

// Prepaid multi-session bundles. These are sold as a block of credit to
// redeem over future visits, not a single timed appointment — so unlike
// `placeholderServices` above, they're not bookable through the online
// calendar. They're listed on the Services page for pricing only; Chanelle
// tracks and redeems them manually when booking returning clients in.
export const sessionCards: SessionCard[] = [
  { id: 'card-3x30', name: '3-Session Card', durationMinutes: 30, sessionCount: 3, pricePence: 7000 },
  { id: 'card-3x60', name: '3-Session Card', durationMinutes: 60, sessionCount: 3, pricePence: 12500 },
  { id: 'card-6x30', name: '6-Session Card', durationMinutes: 30, sessionCount: 6, pricePence: 13000 },
  { id: 'card-6x60', name: '6-Session Card', durationMinutes: 60, sessionCount: 6, pricePence: 25000 },
];
