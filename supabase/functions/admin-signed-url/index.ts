// SettleMe — admin-signed-url.
//
// POST { path: string } → 200 { url: string }
// Auth: requires the caller's JWT to belong to a profile with is_admin = true.
// Generates a short-lived signed URL for an object in the private kyc bucket.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SIGN_TTL_SECONDS = 120;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const body = await req.json().catch(() => null);
  const path = body?.path as string | undefined;
  if (!path) {
    return new Response('Missing path', { status: 400, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  const { data: signed, error: signErr } = await admin.storage
    .from('kyc')
    .createSignedUrl(path, SIGN_TTL_SECONDS);

  if (signErr || !signed) {
    return new Response(JSON.stringify({ error: signErr?.message ?? 'sign failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ url: signed.signedUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
