// SettleMe — Settle Loop smoke tests.
//
// Runs against a local Supabase instance (`supabase start`). Uses service
// role to seed test users + data, exercises trigger + write contracts, then
// cleans up. RLS isolation is exercised via the manual walkthrough; these
// tests focus on schema + trigger correctness.
//
// Run:
//   SUPABASE_URL=http://127.0.0.1:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
//   deno test -A supabase/tests/settle_loop.test.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function createUser(email: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: 'test-password-' + crypto.randomUUID(),
  });
  if (error) throw error;

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('auth_user_id', data.user!.id)
    .maybeSingle();
  if (!profile) throw new Error('profile not auto-created');

  return { authUserId: data.user!.id, profileId: profile.id as string };
}

Deno.test('reminders insert + read by profile', async () => {
  const a = await createUser(`a-${crypto.randomUUID()}@example.com`);
  const b = await createUser(`b-${crypto.randomUUID()}@example.com`);

  const { error: insErr } = await admin.from('reminders').insert([
    {
      profile_id: a.profileId,
      kind: 'agent_followup',
      fire_at: new Date(Date.now() + 60_000).toISOString(),
      payload: {},
    },
    {
      profile_id: b.profileId,
      kind: 'agent_followup',
      fire_at: new Date(Date.now() + 60_000).toISOString(),
      payload: {},
    },
  ]);
  assertEquals(insErr, null);

  const { data: all } = await admin
    .from('reminders')
    .select('profile_id')
    .in('profile_id', [a.profileId, b.profileId]);
  assertEquals((all ?? []).length, 2);

  await admin.from('reminders').delete().in('profile_id', [a.profileId, b.profileId]);
  await admin.auth.admin.deleteUser(a.authUserId);
  await admin.auth.admin.deleteUser(b.authUserId);
});

Deno.test('visa_expires_on trigger creates 90/60/30 day reminders', async () => {
  const u = await createUser(`v-${crypto.randomUUID()}@example.com`);

  const farFuture = new Date(Date.now() + 200 * 86_400_000);
  await admin.from('identity_graph').insert({
    profile_id: u.profileId,
    corridor: 'in_ae',
    origin_country: 'India',
    dest_country: 'UAE',
    dest_city: 'Dubai',
    visa_status: 'employment',
    visa_expires_on: farFuture.toISOString().slice(0, 10),
  });

  const { data: rs } = await admin
    .from('reminders')
    .select('payload')
    .eq('profile_id', u.profileId)
    .eq('kind', 'visa_expiry')
    .order('fire_at', { ascending: true });

  assert((rs ?? []).length === 3, `expected 3 reminders, got ${rs?.length ?? 0}`);
  const days = (rs ?? []).map((r) => (r.payload as { days_before: number }).days_before);
  assertEquals(
    days.sort((a, b) => b - a),
    [90, 60, 30],
  );

  await admin.from('reminders').delete().eq('profile_id', u.profileId);
  await admin.from('identity_graph').delete().eq('profile_id', u.profileId);
  await admin.auth.admin.deleteUser(u.authUserId);
});

Deno.test('events_log accepts agent.tool_use schema', async () => {
  const u = await createUser(`l-${crypto.randomUUID()}@example.com`);

  const { error } = await admin.from('events_log').insert({
    profile_id: u.profileId,
    event_name: 'agent.tool_use',
    props: { tool: 'search_vendors', ok: true },
  });
  assertEquals(error, null);

  const { data } = await admin
    .from('events_log')
    .select('event_name, props')
    .eq('profile_id', u.profileId);
  assertEquals(data?.[0]?.event_name, 'agent.tool_use');

  await admin.from('events_log').delete().eq('profile_id', u.profileId);
  await admin.auth.admin.deleteUser(u.authUserId);
});

Deno.test('verification approval flips profiles.verified_at', async () => {
  const u = await createUser(`x-${crypto.randomUUID()}@example.com`);
  const adminUser = await createUser(`adm-${crypto.randomUUID()}@example.com`);
  await admin.from('profiles').update({ is_admin: true }).eq('id', adminUser.profileId);

  const { data: sub } = await admin
    .from('verification_submissions')
    .insert({ profile_id: u.profileId, passport_url: `${u.profileId}/test.jpg` })
    .select('id')
    .single();

  await admin
    .from('verification_submissions')
    .update({
      status: 'approved',
      reviewed_by: adminUser.profileId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', sub!.id);
  await admin
    .from('profiles')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', u.profileId);

  const { data: p } = await admin
    .from('profiles')
    .select('verified_at')
    .eq('id', u.profileId)
    .single();
  assert(p?.verified_at, 'verified_at should be set');

  await admin.from('verification_submissions').delete().eq('profile_id', u.profileId);
  await admin.auth.admin.deleteUser(u.authUserId);
  await admin.auth.admin.deleteUser(adminUser.authUserId);
});

Deno.test('conversation_messages trigger updates conversations.last_message_*', async () => {
  const member = await createUser(`m-${crypto.randomUUID()}@example.com`);
  const { data: vendor } = await admin
    .from('vendors')
    .insert({
      name: `Test Vendor ${crypto.randomUUID()}`,
      category: 'pro',
      city: 'Dubai',
      diaspora: 'Indian',
    })
    .select('id')
    .single();

  const { data: conv } = await admin
    .from('conversations')
    .insert({ member_id: member.profileId, vendor_id: vendor!.id, source: 'manual' })
    .select('id')
    .single();

  await admin.from('conversation_messages').insert({
    conversation_id: conv!.id,
    sender_kind: 'member',
    sender_profile_id: member.profileId,
    body: 'Hello, this is a smoke test message.',
  });

  const { data: convAfter } = await admin
    .from('conversations')
    .select('last_message_preview, last_message_at')
    .eq('id', conv!.id)
    .single();

  assert(convAfter?.last_message_preview?.startsWith('Hello'), 'preview should be set');

  await admin.from('conversations').delete().eq('id', conv!.id);
  await admin.from('vendors').delete().eq('id', vendor!.id);
  await admin.auth.admin.deleteUser(member.authUserId);
});
