# Content checklist — replace before launch

## Business info — [src/data/site.ts](src/data/site.ts)

- [x] Phone, email, address, Instagram/Facebook/TikTok — real details added
- [ ] `hours` — confirm real opening hours with Chanelle (currently a reasonable guess; should
      match the `business_hours` table in Supabase once that's set up — see below)

## Bio — [src/pages/about.astro](src/pages/about.astro)

- [ ] Chanelle's real bio, qualifications/certifications, years of experience (currently generic
      "qualified sports massage therapist" placeholder text — positioning is now correct, i.e.
      sports massage rather than general relaxation/spa, based on the real price list, but the
      specifics are still invented)
- [ ] "My approach" section — real philosophy/values statement
- [ ] Real photo of Chanelle (replace the `<PlaceholderPhoto>`)

## Services & prices — Supabase `services` table (or [src/data/services.ts](src/data/services.ts) as a fallback)

- [x] The 4 single-session options are real and wired in:
  - Sports Massage — 30 min — £25
  - Sports Massage — 60 min — £45
  - Sports Massage & Consultation — 30 min — £30
  - Sports Massage & Consultation — 60 min — £50
- [ ] **Still need a decision on the session-card packages** (not yet added anywhere):
  - 3-session card, 30 min — £70
  - 3-session card, 60 min — £125
  - 6-session card, 30 min — £130
  - 6-session card, 60 min — £250
  - These are prepaid bundles of *future* sessions, not single bookable appointments — the
    current booking system only handles one-off appointments, so "booking" a session card
    wouldn't make sense through the online calendar as-is. Options: (a) list them on the Services
    page as informational pricing only ("ask in person to purchase a session card"), or (b) build
    proper credit tracking (a customer's remaining session balance, redeemed against future
    bookings) — a meaningfully bigger feature. Ask Claude to scope this once a decision is made.
- [ ] Once Supabase is live, add these via the `/admin/` dashboard (recommended, since that's the
      source of truth the live Services page reads from) rather than only editing the fallback
      file

## Photos — [src/pages/gallery.astro](src/pages/gallery.astro)

- [ ] Replace every `<PlaceholderPhoto>` tile with a real photo:
  1. Add image files to `public/images/gallery/`
  2. Swap `<PlaceholderPhoto label="..." />` for `<img src={withBase('images/gallery/your-file.jpg')} alt="..." loading="lazy" class="rounded-2xl object-cover" />`
- [ ] Also replace the hero photo on the homepage (`src/pages/index.astro`) and the About page
      photo the same way

## Location — [src/pages/location.astro](src/pages/location.astro)

- [x] Real address wired in (5 Avon Close, Granby Industrial Estate, Weymouth, DT4 9UX), with an
      OpenStreetMap embed geocoded to that exact postcode plus a "Get Directions" link
- [ ] Real parking / public transport / accessibility directions — still placeholder bullet points

## Branding

- [x] Colour palette (black + gold, `src/styles/global.css`) and typography (Alex Brush script
      wordmark + Cormorant Garamond headings) match the real Chanelle's Massage logo
- [x] Real logo wired in: `public/images/logo.jpg` (full logo, used in the header), a cropped
      emblem-only version for `public/favicon.png` / `public/apple-touch-icon.png`, and
      `public/images/og-image.jpg` for social share previews. The footer keeps the script-font
      text wordmark instead of the image, since the logo file has a solid black background that
      would show as a visible box against the footer's gold background.

## Legal

- [ ] Consider adding a privacy policy page — the booking form collects name, email and phone
      number (stored in Supabase), which under UK GDPR should be disclosed
