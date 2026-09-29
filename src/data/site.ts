// Central place for business info shown across the site.
// Anything marked TODO should be replaced with Chanelle's real details before launch.
// See CONTENT-CHECKLIST.md at the repo root for the full list.

export const business = {
  name: "Chanelle's Massage",
  shortName: "Chanelle's",
  tagline: 'Relaxation & Deep Tissue Massage Therapy in Weymouth',
  metaDescription:
    'Chanelle’s Massage offers professional relaxation, deep tissue and sports massage therapy in Weymouth, Dorset. Book your appointment online today.',

  // TODO: replace with the real phone number
  phoneDisplay: '01305 XXX XXX',
  phoneHref: 'tel:+441305000000',

  // TODO: replace with the real contact email (example.com is a placeholder domain)
  email: 'hello@example.com',

  // TODO: replace with the real studio address
  address: {
    line1: 'Add your studio address',
    line2: 'Weymouth',
    region: 'Dorset',
    postcode: 'DTx xxx',
    country: 'United Kingdom',
  },

  town: 'Weymouth, Dorset',

  social: {
    instagram: 'https://www.instagram.com/chanellesmassage',
  },

  // TODO: confirm real opening hours with Chanelle — these mirror the
  // `business_hours` table in Supabase (see supabase/schema.sql) and should
  // be kept in sync, or read from Supabase at build time once configured.
  hours: [
    { day: 'Monday', open: '09:00', close: '17:00' },
    { day: 'Tuesday', open: '09:00', close: '17:00' },
    { day: 'Wednesday', open: '09:00', close: '17:00' },
    { day: 'Thursday', open: '09:00', close: '19:00' },
    { day: 'Friday', open: '09:00', close: '19:00' },
    { day: 'Saturday', open: '10:00', close: '15:00' },
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
