// Supabase Edge Function — sends two emails whenever a new booking request
// comes in: a confirmation to the customer, and a notification to Chanelle.
// Triggered by a Database Webhook on `bookings` INSERT (see
// supabase/webhook-setup.md for how to wire it up).
//
// Requires one secret to be set (Dashboard > Edge Functions > Secrets):
//   RESEND_API_KEY — from https://resend.com (free tier: 100 emails/day,
//   3,000/month, no credit card needed)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// Supabase to every Edge Function — no need to set those yourself.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// TODO: once a domain is verified in Resend (e.g. chanellesmassage.co.uk),
// change this to something like 'Chanelle\'s Massage <bookings@chanellesmassage.co.uk>'
// for a more professional sender address. Resend's shared address below
// works immediately with no extra setup, but shows "via resend.dev".
const FROM_EMAIL = "Chanelle's Massage <onboarding@resend.dev>";
const CHANELLE_EMAIL = 'chanellesmassage@gmail.com';
const ADMIN_URL = 'https://www.chanellesmassage.co.uk/admin/';

interface BookingRecord {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  notes: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: BookingRecord;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'bookings') {
    return new Response('Ignored', { status: 200 });
  }

  const booking = payload.record;

  let serviceName = 'Treatment';
  try {
    const serviceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/services?id=eq.${booking.service_id}&select=name`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY ?? '',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const rows = await serviceRes.json();
    if (Array.isArray(rows) && rows[0]?.name) serviceName = rows[0].name;
  } catch (err) {
    console.error('Could not look up service name', err);
  }

  const whenText = new Date(booking.start_at).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });

  const customerHtml = `
    <p>Hi ${escapeHtml(booking.customer_name)},</p>
    <p>Thanks for your booking request with Chanelle's Massage!</p>
    <p><strong>${escapeHtml(serviceName)}</strong><br>${whenText}</p>
    <p>Your request is <strong>pending confirmation</strong> — Chanelle will be in touch shortly
    to confirm your appointment.</p>
    <p>Questions in the meantime? Call 07435 617414.</p>
  `;

  const adminHtml = `
    <p>New booking request:</p>
    <ul>
      <li><strong>Service:</strong> ${escapeHtml(serviceName)}</li>
      <li><strong>When:</strong> ${whenText}</li>
      <li><strong>Name:</strong> ${escapeHtml(booking.customer_name)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(booking.customer_phone)}</li>
      <li><strong>Email:</strong> ${escapeHtml(booking.customer_email)}</li>
      ${booking.notes ? `<li><strong>Notes:</strong> ${escapeHtml(booking.notes)}</li>` : ''}
    </ul>
    <p><a href="${ADMIN_URL}">Confirm or manage it in the admin dashboard</a>.</p>
  `;

  const results = await Promise.allSettled([
    sendEmail(booking.customer_email, "Your booking request — Chanelle's Massage", customerHtml),
    sendEmail(CHANELLE_EMAIL, `New booking: ${booking.customer_name} — ${whenText}`, adminHtml),
  ]);

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error('Some emails failed to send', failed);
    // Still return 200 — the booking itself succeeded and is in the admin
    // dashboard regardless of whether the email notification worked.
  }

  return new Response('ok', { status: 200 });
});

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    throw new Error(`Resend API error (${res.status}): ${await res.text()}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
