// SettleMe — analytics primitive.
//
// `track(event, props)` inserts a row into events_log. Fire-and-forget;
// failures never surface to the UI. Server-side handlers (agent-stream,
// reminder-tick, notify-member-of-reply) write directly via service role.

import { supabase } from './supabase';

export async function track(event: string, props: Record<string, unknown> = {}): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUid = sessionData.session?.user.id;
    if (!authUid) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', authUid)
      .maybeSingle();
    await supabase.from('events_log').insert({
      profile_id: profile?.id ?? null,
      event_name: event,
      props,
    });
  } catch {
    // analytics must never break the app
  }
}
