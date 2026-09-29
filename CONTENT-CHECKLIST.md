# Content checklist — replace before launch

Everything below is placeholder, invented to demonstrate the site's structure since Instagram's
login wall blocked automated access to the real bio/photos/prices. Nothing here is real contact
info — do not let it go live as-is.

## Business info — [src/data/site.ts](src/data/site.ts)

- [ ] `phoneDisplay` / `phoneHref` — real phone number
- [ ] `email` — real contact email (currently `hello@example.com`, an intentionally fake
      placeholder domain)
- [ ] `address` — real studio address and postcode
- [ ] `hours` — confirm real opening hours (should match the `business_hours` table in Supabase
      once that's set up — see below)

## Bio — [src/pages/about.astro](src/pages/about.astro)

- [ ] Chanelle's real bio, qualifications/certifications, years of experience
- [ ] "My approach" section — real philosophy/values statement
- [ ] Real photo of Chanelle (replace the `<PlaceholderPhoto>`)

## Services & prices — Supabase `services` table (or [src/data/services.ts](src/data/services.ts) as a fallback)

- [ ] Real treatment names, descriptions, durations and prices — either edit directly in the
      `/admin/` dashboard once Supabase is set up (recommended), or edit the fallback list in
      `src/data/services.ts`

## Photos — [src/pages/gallery.astro](src/pages/gallery.astro)

- [ ] Replace every `<PlaceholderPhoto>` tile with a real photo:
  1. Add image files to `public/images/gallery/`
  2. Swap `<PlaceholderPhoto label="..." />` for `<img src={withBase('images/gallery/your-file.jpg')} alt="..." loading="lazy" class="rounded-2xl object-cover" />`
- [ ] Also replace the hero photo on the homepage (`src/pages/index.astro`) and the About page
      photo the same way

## Location — [src/pages/location.astro](src/pages/location.astro)

- [ ] Real address (also update `src/data/site.ts`)
- [ ] Real parking / public transport / accessibility directions
- [ ] Once the real address is known, replace the generic Weymouth-centre OpenStreetMap embed
      with a proper Google Maps embed for that exact address (Google Maps > Share > Embed a map)

## Branding

- [ ] The colour palette (`src/styles/global.css`), fonts (Cormorant Garamond + Work Sans, set in
      `src/layouts/BaseLayout.astro`) and favicon (`public/favicon.svg`) are a tasteful placeholder
      spa palette — swap in Chanelle's real brand colours/logo/fonts if she has them
- [ ] `og:image` — no social-share preview image is set yet; add one for nicer link previews when
      the site is shared on social media

## Legal

- [ ] Consider adding a privacy policy page — the booking form collects name, email and phone
      number (stored in Supabase), which under UK GDPR should be disclosed
