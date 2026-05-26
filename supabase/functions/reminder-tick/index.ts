// SettleMe — reminder-tick.
//
// Cron-invoked (every 15 min via pg_cron). Finds due reminders, sends Expo
// pushes, marks them fired. Also callable manually with
// `{ "force_profile_id": "..." }` for dev / QA.
//
// Response: { processed, sent, failed }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { sendExpoPush, type ExpoPushMessage } from '../_shared/expoPush.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_PER_TICK = 200;

type Reminder = {
  id: string;
  profile_id: string;
  kind: 'visa_expiry' | 'event_rsvp' | 'agent_followup' | 'tax_deadline';
  fire_at: string;
  payload: Record<string, unknown>;
  channel: 'push' | 'inapp';
};

type PushToken = {
  profile_id: string;
  expo_token: string;
};

function composeMessage(r: Reminder): { title: string; body: string; data: Record<string, unknown> } {
  const data = { reminder_id: r.id, kind: r.kind, deep_link: `settleme://reminders/${r.id}` };
  switch (r.kind) {
    case 'visa_expiry': {
      const days = (r.payload?.days_before as number | undefined) ?? 30;
      return {
        title: `Your visa expires in ${days} days`,
        body: 'Tap to see your renewal playbook and book a trusted PRO.',
        data,
      };
    }
    case 'event_rsvp': {
      const title = (r.payload?.title as string | undefined) ?? 'Your event is soon';
      return {
        title: 'Heads up — your event starts soon',
        body: title,
        data,
      };
    }
    case 'agent_followup': {
      const summary =
        (r.payload?.summary as string | undefined) ?? 'SettleMe has an update for you.';
      return { title: 'SettleMe follow-up', body: summary, data };
    }
    case 'tax_deadline': {
      const what = (r.payload?.what as string | undefined) ?? 'Tax deadline approaching';
      return { title: what, body: 'Open SettleMe to see what to file and who can help.', data };
    }
    default:
      return { title: 'SettleMe', body: 'You have a new update.', data };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  let forceProfileId: string | undefined;
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    forceProfileId = body?.force_profile_id;
  }

  const baseQuery = admin
    .from('reminders')
    .select('id, profile_id, kind, fire_at, payload, channel')
    .is('fired_at', null)
    .order('fire_at', { ascending: true })
    .limit(MAX_PER_TICK);

  const { data: due, error: dueErr } = forceProfileId
    ? await baseQuery.eq('profile_id', forceProfileId)
    : await baseQuery.lte('fire_at', new Date().toISOString());

  if (dueErr) {
    return new Response(JSON.stringify({ error: dueErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const reminders = (due as Reminder[] | null) ?? [];
  if (reminders.length === 0) {
    return new Response(JSON.stringify({ processed: 0, sent: 0, failed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const profileIds = [...new Set(reminders.map((r) => r.profile_id))];
  const { data: tokens } = await admin
    .from('push_tokens')
    .select('profile_id, expo_token')
    .in('profile_id', profileIds);

  const tokensByProfile = new Map<string, string[]>();
  for (const t of (tokens as PushToken[] | null) ?? []) {
    const arr = tokensByProfile.get(t.profile_id) ?? [];
    arr.push(t.expo_token);
    tokensByProfile.set(t.profile_id, arr);
  }

  const messages: ExpoPushMessage[] = [];
  const firedIds: string[] = [];
  const logRows: Array<{ profile_id: string; event_name: string; props: Record<string, unknown> }> = [];

  for (const r of reminders) {
    firedIds.push(r.id);
    if (r.channel !== 'push') continue;
    const composed = composeMessage(r);
    const targets = tokensByProfile.get(r.profile_id) ?? [];
    for (const to of targets) {
      messages.push({
        to,
        title: composed.title,
        body: composed.body,
        data: composed.data,
        sound: 'default',
        priority: 'high',
      });
    }
    logRows.push({
      profile_id: r.profile_id,
      event_name: 'reminder_fired',
      props: { kind: r.kind, channel: r.channel, has_token: targets.length > 0 },
    });
  }

  const result = await sendExpoPush(admin, messages);

  if (firedIds.length > 0) {
    await admin
      .from('reminders')
      .update({ fired_at: new Date().toISOString() })
      .in('id', firedIds);
  }
  if (logRows.length > 0) {
    await admin.from('events_log').insert(logRows);
  }

  return new Response(
    JSON.stringify({ processed: reminders.length, ...result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
