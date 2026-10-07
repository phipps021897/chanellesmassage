// Central place for business info shown across the site.
// Anything marked TODO should be replaced with Chanelle's real details before launch.
// See CONTENT-CHECKLIST.md at the repo root for the full list.

export const business = {
  name: "Chanelle's Massage",
  shortName: "Chanelle's",
  tagline: 'Sports Massage Therapy in Weymouth',
  metaDescription:
    'Chanelle’s Massage offers professional sports massage therapy in Weymouth, Dorset — supporting recovery, mobility and injury prevention. Book your appointment online today.',

  phoneDisplay: '07435 617414',
  phoneHref: 'tel:+447435617414',

  email: 'chanellesmassage@gmail.com',

  address: {
    line1: '5 Avon Close',
    line2: 'Granby Industrial Estate',
    locality: 'Weymouth',
    region: 'Dorset',
    postcode: 'DT4 9UX',
    country: 'United Kingdom',
  },

  town: 'Weymouth, Dorset',

  social: {
    instagram: 'https://www.instagram.com/chanellesmassage',
    facebook: 'https://www.facebook.com/chanellesmassage',
    tiktok: 'https://www.tiktok.com/@chanellesmassage',
  },

  // The old single-week schedule — still in effect for bookings before
  // BIWEEKLY_ANCHOR_DATE (see src/lib/biweekly.ts). Mirrors the
  // `business_hours` table in Supabase.
  legacyHours: [
    { day: 'Monday', open: '09:00', close: '17:00' },
    { day: 'Tuesday', open: '09:00', close: '17:00' },
    { day: 'Wednesday', open: '09:00', close: '17:00' },
    { day: 'Thursday', open: '09:00', close: '19:00' },
    { day: 'Friday', open: '09:00', close: '19:00' },
    { day: 'Saturday', open: '10:00', close: '15:00' },
    { day: 'Sunday', open: null, close: null },
  ],

  // Hours alternate on a 2-week cycle from BIWEEKLY_ANCHOR_DATE (see
  // src/lib/biweekly.ts) onward. These mirror the `biweekly_hours` table in
  // Supabase (see supabase/schema.sql) — keep in sync, or edit via /admin/
  // and update here to match for the static Location page display.
  week1Hours: [
    { day: 'Monday', open: '08:00', close: '18:00' },
    { day: 'Tuesday', open: '18:00', close: '21:00' },
    { day: 'Wednesday', open: '18:00', close: '21:00' },
    { day: 'Thursday', open: null, close: null },
    { day: 'Friday', open: '18:00', close: '21:00' },
    { day: 'Saturday', open: '18:00', close: '21:00' },
    { day: 'Sunday', open: '08:00', close: '11:00' },
  ],
  week2Hours: [
    { day: 'Monday', open: '08:00', close: '18:00' },
    { day: 'Tuesday', open: '08:00', close: '16:00' },
    { day: 'Wednesday', open: '07:30', close: '09:30' },
    { day: 'Thursday', open: null, close: null },
    { day: 'Friday', open: '07:30', close: '09:30' },
    { day: 'Saturday', open: '07:30', close: '09:30' },
    { day: 'Sunday', open: null, close: null },
  ],
};

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/about/', label: 'About' },
  { href: '/services/', label: 'Services' },
  { href: '/gallery/', label: 'Gallery' },
  { href: '/location/', label: 'Location' },
  { href: '/contact/', label: 'Contact' },
];
