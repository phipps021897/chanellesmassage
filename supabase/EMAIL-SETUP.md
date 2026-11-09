# Booking confirmation emails

Sends two emails whenever someone submits a booking request: a confirmation to the customer, and
a notification to `chanelle_w08@outlook.com`.

**Status: live.** The Edge Function is deployed, the `RESEND_API_KEY` secret is set, and the
database trigger is wired up. The steps below are for reference (e.g. redeploying to a new
Supabase project) rather than things that still need doing.

## 1. Resend account

[resend.com](https://resend.com) → free tier (100 emails/day, 3,000/month, no card required) →
**API Keys** → create one, scoped to "Sending access" only.

## 2. Deploy the Edge Function

Either via the dashboard (**Edge Functions** → **Create a new function**, name it
`send-booking-emails`, paste in
[`supabase/functions/send-booking-emails/index.ts`](./functions/send-booking-emails/index.ts),
**Deploy**, with **Enforce JWT verification turned off** since the trigger below calls it without a
user session) — or via the Management API, which is how it was actually set up here:

```sh
curl -X POST "https://api.supabase.com/v1/projects/<project-ref>/functions" \
  -H "Authorization: Bearer <supabase personal access token>" \
  -H "Content-Type: application/json" \
  -d '{"slug":"send-booking-emails","name":"send-booking-emails","verify_jwt":false,"entrypoint_path":"index.ts","body":"<file contents>"}'
```

## 3. Set the Resend API key as a secret

Dashboard: **Edge Functions** → **Secrets** → add `RESEND_API_KEY`. Via API:

```sh
curl -X POST "https://api.supabase.com/v1/projects/<project-ref>/secrets" \
  -H "Authorization: Bearer <supabase personal access token>" \
  -H "Content-Type: application/json" \
  -d '[{"name":"RESEND_API_KEY","value":"<your resend key>"}]'
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to every Edge Function —
nothing to add for those.)

## 4. Wire up the trigger

The dashboard's **Database → Webhooks** UI depends on a `supabase_functions` helper schema that
only gets created the first time you use that UI — on a project that's never had one, trying to
create a trigger that references it fails with `schema "supabase_functions" does not exist`. The
reliable fix is to use `pg_net` directly instead (run in the SQL Editor):

```sql
create extension if not exists pg_net;

create or replace function public.trigger_send_booking_emails()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-booking-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'bookings',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists send_booking_emails_trigger on public.bookings;
create trigger send_booking_emails_trigger
after insert on public.bookings
for each row
execute function public.trigger_send_booking_emails();
```

This builds the exact same `{type, table, record}` JSON shape the Edge Function expects, without
depending on any dashboard-provisioned schema.

## 5. Test it

Submit a booking through `/booking/` with a real email you can check, or invoke the function
directly with a fake payload:

```sh
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-booking-emails" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"bookings","record":{"id":"test","service_id":"00000000-0000-0000-0000-000000000000","customer_name":"Test","customer_email":"you@example.com","customer_phone":"0","start_at":"2026-11-10T14:00:00Z","end_at":"2026-11-10T14:30:00Z","notes":""}}'
```

If emails don't arrive, check **Edge Functions → send-booking-emails → Logs** in the dashboard —
most likely cause is a missing/mistyped `RESEND_API_KEY`.

## Notes

- Emails send from `bookings@chanellesmassage.co.uk` — `chanellesmassage.co.uk` is verified as a
  sending domain in Resend (**Domains**), with DNS records added at GoDaddy alongside the GitHub
  Pages ones. Without a verified domain, Resend's sandbox mode silently restricts delivery to only
  the Resend account's own email address — if emails ever stop arriving, check **Domains** in
  Resend first for a verification that's lapsed or broken.
- If email sending fails for any reason, the booking itself still succeeds and shows up in the
  admin dashboard as normal — `net.http_post` is fire-and-forget and doesn't block the insert.
