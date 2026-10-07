# Content checklist — replace before launch

## Business info — [src/data/site.ts](src/data/site.ts)

- [x] Phone, email, address, Instagram/Facebook/TikTok — real details added
- [x] Real alternating fortnightly hours added (Week 1 / Week 2, starting Mon 12 Oct 2026) — see
      "Action needed" below to activate them

## ⚠️ Action needed: run the updated Supabase schema

The alternating-hours feature added a new `biweekly_hours` table that **does not exist yet** in
the live Supabase project — until it's created, dates from 12 Oct 2026 onward will show no
booking availability (the site degrades gracefully rather than erroring, but customers won't be
able to book that far ahead). To activate it:

1. Supabase dashboard → **SQL Editor** → **New query**
2. Paste the full contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it — safe to
   re-run, it won't touch existing services/bookings/current hours
3. Check **Admin → Availability** shows "Week 1" and "Week 2" sections with the right hours

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
- [x] Session card packages (3/6-session bundles) listed on the Services page as informational
      pricing (`src/data/services.ts` → `sessionCards`) — not bookable online, same as today;
      revisit if real credit tracking/redemption is ever wanted
- [ ] Once Supabase is live, add these via the `/admin/` dashboard (recommended, since that's the
      source of truth the live Services page reads from) rather than only editing the fallback
      file

## Photos — [src/pages/gallery.astro](src/pages/gallery.astro)

- [x] 3 real photos added (treatment room, back massage, leg massage) — the best one (natural
      light, full scene) is also used as the homepage hero
- [ ] Still placeholder: Reception/waiting area, Product/oils detail shot, Exterior/signage —
      same swap pattern as above once more photos are available
- [ ] About page photo of Chanelle herself still placeholder (none of the 3 provided are a clean
      solo portrait)

## Location — [src/pages/location.astro](src/pages/location.astro)

- [x] Real address wired in (5 Avon Close, Granby Industrial Estate, Weymouth, DT4 9UX), with a
      Google Maps embed for that exact address plus a "Get Directions" link

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
