// SettleMe — notify-member-of-reply.
//
// Invoked by a Postgres trigger on conversation_messages insert when a vendor
// replies. Body: { conversation_id, message_id }. Sends an Expo push to the
// member with a deep link to the thread.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { sendExpoPush, type ExpoPushMessage } from '../_shared/expoPush.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const body = await req.json().catch(() => null);
  const conversation_id = body?.conversation_id as string | undefined;
  const message_id = body?.message_id as string | undefined;
  if (!conversation_id || !message_id) {
    return new Response('Missing conversation_id or message_id', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: msg } = await admin
    .from('conversation_messages')
    .select('id, body, sender_kind, conversation_id')
    .eq('id', message_id)
    .maybeSingle();

  if (!msg || msg.sender_kind !== 'vendor') {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: conv } = await admin
    .from('conversations')
    .select('member_id, vendor:vendors(name)')
    .eq('id', conversation_id)
    .maybeSingle();

  if (!conv?.member_id) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: tokens } = await admin
    .from('push_tokens')
    .select('expo_token')
    .eq('profile_id', conv.member_id);

  const vendorName =
    (conv as { vendor?: { name?: string } | null }).vendor?.name ?? 'A vendor';
  const preview = msg.body.slice(0, 140);

  const messages: ExpoPushMessage[] = (tokens ?? []).map((t) => ({
    to: t.expo_token,
    title: `${vendorName} replied`,
    body: preview,
    data: {
      kind: 'vendor_reply',
      conversation_id,
      deep_link: `settleme://messaging/${conversation_id}`,
    },
    sound: 'default',
    priority: 'high',
  }));

  const result = await sendExpoPush(admin, messages);

  await admin.from('events_log').insert({
    profile_id: conv.member_id,
    event_name: 'vendor_reply_push',
    props: { conversation_id, sent: result.sent, failed: result.failed },
  });

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
