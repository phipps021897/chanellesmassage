# Chanelle's Massage — website & booking system

A modern, SEO-friendly website for Chanelle's Massage (Weymouth, Dorset), with a full online
booking system and an admin dashboard for managing bookings, services and availability.

**Stack:** [Astro](https://astro.build) (static site, best-in-class SEO) + React islands for the
interactive booking form and admin dashboard + [Supabase](https://supabase.com) (Postgres +
Auth) as the booking backend + Tailwind CSS for styling. Hosted for free on GitHub Pages.

---

## 1. Before launch: replace placeholder content

Real business details (bio, address, phone, prices, photos) weren't available when this was
built (Instagram blocks automated access), so the site ships with clearly-marked placeholder
content. **See [CONTENT-CHECKLIST.md](./CONTENT-CHECKLIST.md) for the full list of what to
update before going live.**

## 2. One-time Supabase setup (powers the booking system)

The booking form and admin dashboard need a Supabase project (free tier is plenty for this).

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor > New query**, paste in the contents of [`supabase/schema.sql`](./supabase/schema.sql),
   and run it. This creates the `services`, `business_hours`, `blocked_slots` and `bookings`
   tables, plus the row-level security policies that keep customer data private.
3. Go to **Authentication > Sign In / Providers** and turn **off** "Allow new users to sign up" —
   there's no public sign-up page in this app, so this stops anyone else self-registering.
4. Go to **Authentication > Users > Add user** and create the one admin account (Chanelle's email
   + a password) — this is the only login the `/admin/` dashboard will ever accept.
5. Go to **Project Settings > API** and copy the **Project URL** and **anon public key**.
6. Locally, copy `.env.example` to `.env` and paste those two values in.
7. For production, add them as **repository variables** (not secrets — the anon key is designed
   to be public, RLS is what protects the data): **Settings > Secrets and variables > Actions >
   Variables** → add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`.

Without this step the site still builds and runs — the Services page falls back to bundled
placeholder data, and the booking/admin pages show a friendly "not configured yet" message
instead of crashing.

## 3. Enable GitHub Pages

**Settings > Pages > Build and deployment > Source: GitHub Actions.** That's it — every push to
`main` runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), which builds the
site and publishes it to `https://phipps021897.github.io/chanellesmassage/`.

If you later attach a custom domain, update `site`/`base` in `astro.config.mjs` (set `base: '/'`)
and the `Sitemap:` line in `public/robots.txt`.

## 4. Local development

```sh
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev            # http://localhost:4321/chanellesmassage/
```

| Command | Action |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npx astro check` | Type-check the whole project |

## How the booking system works

- **Public booking flow** (`/booking/`): visitor picks a service → an available date/time
  (computed client-side from business hours, blocked-out time and existing bookings) → enters
  their details → submits. This creates a `pending` booking in Supabase. There's no online
  payment — Chanelle confirms manually, by phone or email.
- **Admin dashboard** (`/admin/`): sign in with the one admin account to confirm/cancel/complete
  bookings, add/edit/hide services and prices, and set weekly hours or block out time off. The
  page is excluded from search engines (`noindex`) and everything it touches is protected by
  Supabase Row Level Security, not just by hiding the page.
- **Services page** (`/services/`): statically generated at build time. If Supabase is
  configured, it fetches the live price list so it stays in sync with what's managed in the admin
  dashboard — otherwise it falls back to `src/data/services.ts`. **Re-run the deploy workflow
  (Actions tab > Deploy to GitHub Pages > Run workflow) after changing prices in the admin
  dashboard** so this static page picks up the change.

### Adding email notifications later

There's no automated "booking confirmed" email yet (kept out of v1 to avoid requiring another
account/API key up front). The cleanest way to add it: a
[Supabase Edge Function](https://supabase.com/docs/guides/functions) triggered by a database
webhook on `bookings` insert/update, sending via [Resend](https://resend.com) or similar.

### Adding online payment later

Also intentionally left out of v1. If wanted later, look at
[Stripe Checkout](https://stripe.com/docs/payments/checkout) triggered from the booking form
after a slot is selected, with the booking only created as `confirmed` once payment succeeds
(via a webhook, not client-side).

## Project structure

```text
src/
  components/       Astro + React components (Header, Footer, BookingWidget, admin/*)
  data/             Business info + placeholder services (src/data/site.ts, services.ts)
  layouts/           BaseLayout.astro — shared <head>, header, footer
  lib/              Supabase client, availability calculation, base-path URL helper
  pages/            One file per route (About, Services, Gallery, Location, Contact, Booking, Admin)
supabase/
  schema.sql        Run this once in the Supabase SQL editor
.github/workflows/
  deploy.yml        Builds and deploys to GitHub Pages on every push to main
```
