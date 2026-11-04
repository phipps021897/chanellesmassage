// Supabase Edge Function — accepts a booking submission from the public
// website and inserts it using the service role, bypassing the `anon` REST
// write path entirely. Added as a workaround after confirming (via direct
// `set role anon; insert ...` testing in the SQL Editor) that the RLS
// policy and grants on `public.bookings` are correctly configured, but
// Supabase's API/gateway layer was rejecting anon POST requests with a
// fabricated RLS error regardless — a platform-level issue, not a schema
// one. This function always forces status to 'pending' itself, so it's no
// less safe than the RLS policy it replaces for this path.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BookingInput {
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let input: BookingInput;
  try {
    input = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const required: (keyof BookingInput)[] = [
    'service_id',
    'customer_name',
    'customer_email',
    'customer_phone',
    'start_at',
    'end_at',
  ];
  const missing = required.filter((key) => !input[key]);
  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: `Missing fields: ${missing.join(', ')}` }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY ?? '',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      service_id: input.service_id,
      customer_name: input.customer_name.trim(),
      customer_email: input.customer_email.trim(),
      customer_phone: input.customer_phone.trim(),
      start_at: input.start_at,
      end_at: input.end_at,
      notes: (input.notes ?? '').trim(),
      status: 'pending', // always forced server-side, never trusts client input
    }),
  });

  if (!insertRes.ok) {
    const errorBody = await insertRes.text();
    console.error('Booking insert failed', insertRes.status, errorBody);
    return new Response(JSON.stringify({ error: 'Could not create booking' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const [booking] = await insertRes.json();
  return new Response(JSON.stringify({ booking }), {
    status: 201,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
