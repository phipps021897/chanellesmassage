# Setting up booking confirmation emails

Sends two emails whenever someone submits a booking request: a confirmation to the customer, and
a notification to `chanelle_w08@outlook.com`. No command line needed — everything below is done
through the Supabase dashboard.

## 1. Create a free Resend account

1. Go to [resend.com](https://resend.com) → sign up (free tier: 100 emails/day, 3,000/month, no
   card required).
2. **API Keys** (left sidebar) → **Create API Key** → copy it (starts with `re_`).

## 2. Create the Edge Function

1. Supabase dashboard → **Edge Functions** (left sidebar) → **Create a new function**
2. Name it exactly `send-booking-emails`
3. Delete the placeholder code and paste in the contents of
   [`supabase/functions/send-booking-emails/index.ts`](./functions/send-booking-emails/index.ts)
   from this repo
4. Click **Deploy**

## 3. Add the Resend API key as a secret

1. Still in **Edge Functions** → **Secrets** (or **Manage secrets**)
2. Add a secret named `RESEND_API_KEY` with the value you copied from Resend
3. (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already available to every Edge Function
   automatically — nothing to add for those.)

## 4. Create the database webhook that triggers it

1. Supabase dashboard → **Database** → **Webhooks** → **Create a new webhook**
2. Name: `send-booking-emails`
3. Table: `bookings`
4. Events: tick **Insert** only (leave Update/Delete unticked)
5. Type: **Supabase Edge Functions**
6. Edge Function: select `send-booking-emails`
7. HTTP method: `POST` (default)
8. Click **Confirm**

## 5. Test it

Submit a test booking through the live site's `/booking/` page using a real email address you can
check. You should get a confirmation email, and `chanelle_w08@outlook.com` should get a
notification email. If not, check **Edge Functions → send-booking-emails → Logs** in the Supabase
dashboard for errors (most likely cause: `RESEND_API_KEY` missing or mistyped).

## Notes

- Emails currently send from Resend's shared address (`onboarding@resend.dev`), so they'll show
  "via resend.dev" in some mail clients. To use a proper `@chanellesmassage.co.uk` sender address
  instead, verify the domain in Resend (**Domains** → **Add Domain** → add the DNS records it
  gives you, similar to the GitHub Pages DNS setup) and update `FROM_EMAIL` in
  `supabase/functions/send-booking-emails/index.ts`.
- If a booking's email fails to send for any reason, the booking itself still succeeds and shows
  up in the admin dashboard as normal — email is a notification layer on top, not a requirement
  for the booking to go through.
