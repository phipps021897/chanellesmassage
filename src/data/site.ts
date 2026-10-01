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
