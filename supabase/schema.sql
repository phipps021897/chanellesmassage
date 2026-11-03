-- Chanelle's Massage — Supabase schema
--
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)
-- for a fresh project. Safe to re-run: uses `create table if not exists`.
--
-- After running this, create the one admin account by hand in
-- Authentication > Users > Add user (email + password) — there is no public
-- sign-up form in the app, so this is the only account that will ever exist.
-- Also go to Authentication > Sign In / Providers and turn OFF "Allow new
-- users to sign up" so nobody else can self-register.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  price_pence int not null check (price_pence >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "public can read active services" on public.services;
create policy "public can read active services"
  on public.services for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "admin can read all services" on public.services;
create policy "admin can read all services"
  on public.services for select
  to authenticated
  using (true);

drop policy if exists "admin can manage services" on public.services;
create policy "admin can manage services"
  on public.services for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- business_hours — weekly recurring template (0 = Sunday .. 6 = Saturday)
-- ---------------------------------------------------------------------------
create table if not exists public.business_hours (
  day_of_week int primary key check (day_of_week between 0 and 6),
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  is_closed boolean not null default false
);

alter table public.business_hours enable row level security;

drop policy if exists "public can read business hours" on public.business_hours;
create policy "public can read business hours"
  on public.business_hours for select
  to anon, authenticated
  using (true);

drop policy if exists "admin can manage business hours" on public.business_hours;
create policy "admin can manage business hours"
  on public.business_hours for all
  to authenticated
  using (true)
  with check (true);

insert into public.business_hours (day_of_week, start_time, end_time, is_closed)
values
  (0, '09:00', '17:00', true),
  (1, '09:00', '17:00', false),
  (2, '09:00', '17:00', false),
  (3, '09:00', '17:00', false),
  (4, '09:00', '19:00', false),
  (5, '09:00', '19:00', false),
  (6, '10:00', '15:00', false)
on conflict (day_of_week) do nothing;

-- ---------------------------------------------------------------------------
-- biweekly_hours — alternating Week 1 / Week 2 schedule, in effect from the
-- anchor date in src/lib/biweekly.ts (12 Oct 2026) onward. Before that date,
-- `business_hours` above still applies. See src/lib/availability.ts for how
-- the two are combined.
-- ---------------------------------------------------------------------------
create table if not exists public.biweekly_hours (
  day_of_week int not null check (day_of_week between 0 and 6),
  week_number int not null check (week_number in (1, 2)),
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  is_closed boolean not null default false,
  primary key (day_of_week, week_number)
);

alter table public.biweekly_hours enable row level security;

drop policy if exists "public can read biweekly hours" on public.biweekly_hours;
create policy "public can read biweekly hours"
  on public.biweekly_hours for select
  to anon, authenticated
  using (true);

drop policy if exists "admin can manage biweekly hours" on public.biweekly_hours;
create policy "admin can manage biweekly hours"
  on public.biweekly_hours for all
  to authenticated
  using (true)
  with check (true);

insert into public.biweekly_hours (day_of_week, week_number, start_time, end_time, is_closed)
values
  -- Week 1 (starting Mon 12 Oct 2026)
  (1, 1, '08:00', '18:00', false), -- Monday 8am-6pm
  (2, 1, '18:00', '21:00', false), -- Tuesday 6-9pm
  (3, 1, '18:00', '21:00', false), -- Wednesday 6-9pm
  (4, 1, '09:00', '17:00', true),  -- Thursday closed
  (5, 1, '18:00', '21:00', false), -- Friday 6-9pm
  (6, 1, '18:00', '21:00', false), -- Saturday 6-9pm
  (0, 1, '08:00', '11:00', false), -- Sunday 8-11am
  -- Week 2 (starting Mon 19 Oct 2026)
  (1, 2, '08:00', '18:00', false), -- Monday 8am-6pm
  (2, 2, '08:00', '16:00', false), -- Tuesday 8am-4pm
  (3, 2, '07:30', '09:30', false), -- Wednesday 7:30-9:30am
  (4, 2, '09:00', '17:00', true),  -- Thursday closed
  (5, 2, '07:30', '09:30', false), -- Friday 7:30-9:30am
  (6, 2, '07:30', '09:30', false), -- Saturday 7:30-9:30am
  (0, 2, '09:00', '17:00', true)   -- Sunday closed
on conflict (day_of_week, week_number) do update set
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  is_closed = excluded.is_closed;

-- ---------------------------------------------------------------------------
-- blocked_slots — one-off closures (holidays, personal time off, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint blocked_slot_range check (end_at > start_at)
);

alter table public.blocked_slots enable row level security;

drop policy if exists "public can read blocked slots" on public.blocked_slots;
create policy "public can read blocked slots"
  on public.blocked_slots for select
  to anon, authenticated
  using (true);

drop policy if exists "admin can manage blocked slots" on public.blocked_slots;
create policy "admin can manage blocked slots"
  on public.blocked_slots for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- bookings — customer PII lives here; never exposed to anon directly
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint booking_range check (end_at > start_at)
);

create index if not exists bookings_start_at_idx on public.bookings (start_at);
create index if not exists bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

-- Anyone can submit a booking request, but only ever as 'pending' — they
-- cannot self-confirm, and they cannot read back other people's bookings.
-- The explicit GRANT is required here — unlike every other table in this
-- file, INSERT on bookings didn't work from the RLS policy alone in
-- practice (Supabase's default privileges didn't cover it for this table).
grant insert on public.bookings to anon, authenticated;

drop policy if exists "public can create pending bookings" on public.bookings;
create policy "public can create pending bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "admin can read all bookings" on public.bookings;
create policy "admin can read all bookings"
  on public.bookings for select
  to authenticated
  using (true);

drop policy if exists "admin can update bookings" on public.bookings;
create policy "admin can update bookings"
  on public.bookings for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin can delete bookings" on public.bookings;
create policy "admin can delete bookings"
  on public.bookings for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- taken_slots — a PII-free view of busy times so the public booking form can
-- work out availability without ever reading customer names/emails/phones.
-- ---------------------------------------------------------------------------
-- Intentionally NOT security_invoker: this view must run with the owner's
-- privileges so it can bypass the bookings RLS policy (which otherwise
-- blocks anon from reading bookings at all) while only ever exposing these
-- four non-identifying columns.
create or replace view public.taken_slots as
select service_id, start_at, end_at, status
from public.bookings
where status in ('pending', 'confirmed');

grant select on public.taken_slots to anon, authenticated;

-- ---------------------------------------------------------------------------
-- booking email notifications — fires the send-booking-emails Edge Function
-- on every new booking (see supabase/EMAIL-SETUP.md for full setup). Uses
-- pg_net directly rather than the dashboard's Database Webhooks UI, since
-- that UI depends on a `supabase_functions` helper schema that's only
-- created the first time you use it — on a project that's never had one,
-- referencing it fails with `schema "supabase_functions" does not exist`.
-- ---------------------------------------------------------------------------
create extension if not exists pg_net;

create or replace function public.trigger_send_booking_emails()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://zzbszhxzurxgwqoabmfo.supabase.co/functions/v1/send-booking-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'bookings',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists send_booking_emails_trigger on public.bookings;
create trigger send_booking_emails_trigger
after insert on public.bookings
for each row
execute function public.trigger_send_booking_emails();
