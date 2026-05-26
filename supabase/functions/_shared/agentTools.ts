// SettleMe — agent tool definitions and dispatcher.
//
// Five tools exposed to Claude via Anthropic tool_use:
//   search_vendors, start_vendor_message, set_visa_reminder,
//   find_community_answers, rsvp_event
//
// Each handler returns a JSON-serialisable object. Errors are returned as
// `{ ok: false, error }` so Claude can recover gracefully.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export interface AgentIdentity {
  origin_country: string | null;
  dest_country: string | null;
  dest_city: string | null;
  corridor: string | null;
  visa_status: string | null;
  visa_expires_on: string | null;
}

export interface AgentToolContext {
  admin: SupabaseClient;
  profileId: string;
  identity: AgentIdentity | null;
}

// ----- Tool schemas (sent to Claude) ------------------------------------

export const AGENT_TOOLS = [
  {
    name: 'search_vendors',
    description:
      "Find trusted, SettleMe-verified vendors for the user's destination city. Use when the user asks for a recommendation (PRO, lawyer, accountant, school, doctor, movers, property). Always prefer this tool over inventing a vendor name.",
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description:
            "One of: pro, lawyer, accountant, property, school, dentist, movers. Use 'pro' for Emirates ID / visa stamping / Mohre / business setup helpers.",
        },
        city: { type: 'string', description: "Defaults to the user's destination city." },
        limit: { type: 'integer', minimum: 1, maximum: 8, default: 5 },
      },
      required: ['category'],
    },
  },
  {
    name: 'start_vendor_message',
    description:
      'Open a new in-app conversation with a vendor and send the first message on behalf of the user. Returns a conversation_id the UI uses to deep-link the user into the thread.',
    input_schema: {
      type: 'object' as const,
      properties: {
        vendor_id: { type: 'string', description: 'UUID returned by search_vendors.' },
        draft_message: {
          type: 'string',
          description:
            "Short, polite first message from the user that includes their corridor context (e.g. 'Hi, I am an Indian national arriving in Dubai next month, looking for help with Emirates ID and visa stamping.').",
        },
      },
      required: ['vendor_id', 'draft_message'],
    },
  },
  {
    name: 'set_visa_reminder',
    description:
      "Create a push-notification reminder anchored to the user's visa_expires_on. Use when the user asks to be reminded about their visa renewal.",
    input_schema: {
      type: 'object' as const,
      properties: {
        days_before: { type: 'integer', minimum: 1, maximum: 365, default: 30 },
        note: { type: 'string', description: 'Optional short note to attach.' },
      },
      required: ['days_before'],
    },
  },
  {
    name: 'find_community_answers',
    description:
      "Search the SettleMe knowledge base and community posts for prior answers similar to the user's question. Use before answering anything where prior community knowledge likely exists.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 8, default: 3 },
      },
      required: ['query'],
    },
  },
  {
    name: 'rsvp_event',
    description:
      'RSVP the current user to a SettleMe event. Creates a 2-hour-before push reminder automatically.',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string', description: 'UUID of the event.' },
      },
      required: ['event_id'],
    },
  },
];

// ----- Dispatcher --------------------------------------------------------

export type ToolName =
  | 'search_vendors'
  | 'start_vendor_message'
  | 'set_visa_reminder'
  | 'find_community_answers'
  | 'rsvp_event';

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export async function runAgentTool(
  ctx: AgentToolContext,
  name: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    switch (name as ToolName) {
      case 'search_vendors':
        return await searchVendors(ctx, input);
      case 'start_vendor_message':
        return await startVendorMessage(ctx, input);
      case 'set_visa_reminder':
        return await setVisaReminder(ctx, input);
      case 'find_community_answers':
        return await findCommunityAnswers(ctx, input);
      case 'rsvp_event':
        return await rsvpEvent(ctx, input);
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ----- Implementations --------------------------------------------------

async function searchVendors(
  ctx: AgentToolContext,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const category = String(input.category ?? '').trim();
  const city = (input.city as string | undefined) ?? ctx.identity?.dest_city ?? 'Dubai';
  const limit = Math.max(1, Math.min(8, Number(input.limit ?? 5)));
  if (!category) return { ok: false, error: 'category required' };

  let q = ctx.admin
    .from('vendors')
    .select('id, name, category, description, rating, review_count, verified_at, whatsapp')
    .eq('city', city)
    .order('rating', { ascending: false })
    .limit(limit);
  if (category !== 'all') q = q.eq('category', category);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { vendors: data ?? [], city, category } };
}

async function startVendorMessage(
  ctx: AgentToolContext,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const vendor_id = String(input.vendor_id ?? '');
  const draft_message = String(input.draft_message ?? '').trim();
  if (!vendor_id || !draft_message) {
    return { ok: false, error: 'vendor_id and draft_message required' };
  }

  const { data: vendor } = await ctx.admin
    .from('vendors')
    .select('id, name, category')
    .eq('id', vendor_id)
    .maybeSingle();
  if (!vendor) return { ok: false, error: 'vendor not found' };

  const { data: existing } = await ctx.admin
    .from('conversations')
    .select('id')
    .eq('member_id', ctx.profileId)
    .eq('vendor_id', vendor_id)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (!conversationId) {
    const { data: created, error: convErr } = await ctx.admin
      .from('conversations')
      .insert({
        member_id: ctx.profileId,
        vendor_id,
        source: 'agent',
      })
      .select('id')
      .single();
    if (convErr || !created) {
      return { ok: false, error: convErr?.message ?? 'failed to create conversation' };
    }
    conversationId = created.id as string;
  }

  const { error: msgErr } = await ctx.admin.from('conversation_messages').insert({
    conversation_id: conversationId,
    sender_kind: 'member',
    sender_profile_id: ctx.profileId,
    body: draft_message,
  });
  if (msgErr) return { ok: false, error: msgErr.message };

  await ctx.admin.from('events_log').insert({
    profile_id: ctx.profileId,
    event_name: 'vendor_message_sent',
    props: { vendor_id, conversation_id: conversationId, source: 'agent' },
  });

  return {
    ok: true,
    data: {
      conversation_id: conversationId,
      vendor_name: vendor.name,
      vendor_category: vendor.category,
    },
  };
}

async function setVisaReminder(
  ctx: AgentToolContext,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const days_before = Math.max(1, Math.min(365, Number(input.days_before ?? 30)));
  const note = (input.note as string | undefined) ?? null;
  if (!ctx.identity?.visa_expires_on) {
    return { ok: false, error: 'visa_expires_on not set on identity_graph' };
  }
  const fireAt = new Date(
    new Date(ctx.identity.visa_expires_on).getTime() - days_before * 86_400_000,
  );
  if (fireAt.getTime() < Date.now()) {
    return { ok: false, error: 'reminder date is in the past' };
  }
  const { data, error } = await ctx.admin
    .from('reminders')
    .insert({
      profile_id: ctx.profileId,
      kind: 'visa_expiry',
      fire_at: fireAt.toISOString(),
      payload: {
        days_before,
        note,
        visa_expires_on: ctx.identity.visa_expires_on,
        visa_status: ctx.identity.visa_status,
        source: 'agent',
      },
    })
    .select('id, fire_at')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'insert failed' };
  return { ok: true, data: { reminder_id: data.id, fire_at: data.fire_at, days_before } };
}

async function findCommunityAnswers(
  ctx: AgentToolContext,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const query = String(input.query ?? '').trim();
  const limit = Math.max(1, Math.min(8, Number(input.limit ?? 3)));
  if (!query) return { ok: false, error: 'query required' };

  const safe = query.replace(/[\\%_]/g, (m) => `\\${m}`);
  const pat = `%${safe}%`;

  let qaQuery = ctx.admin
    .from('qa_questions')
    .select('question, answer_md, category')
    .or(`question.ilike.${pat},answer_md.ilike.${pat}`)
    .limit(limit);
  if (ctx.identity?.corridor) {
    qaQuery = qaQuery.eq('corridor', ctx.identity.corridor);
  }

  const [{ data: qa }, { data: posts }] = await Promise.all([
    qaQuery,
    ctx.admin
      .from('posts')
      .select('body, upvotes, created_at')
      .ilike('body', pat)
      .order('upvotes', { ascending: false })
      .limit(limit),
  ]);

  return {
    ok: true,
    data: {
      qa: qa ?? [],
      posts: posts ?? [],
    },
  };
}

async function rsvpEvent(
  ctx: AgentToolContext,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const event_id = String(input.event_id ?? '');
  if (!event_id) return { ok: false, error: 'event_id required' };

  const { data: ev, error: evErr } = await ctx.admin
    .from('events')
    .select('id, title, starts_at, location')
    .eq('id', event_id)
    .maybeSingle();
  if (evErr || !ev) return { ok: false, error: 'event not found' };

  const { error: rsvpErr } = await ctx.admin.from('event_rsvps').upsert(
    {
      event_id,
      profile_id: ctx.profileId,
      status: 'going',
    },
    { onConflict: 'event_id,profile_id' },
  );
  if (rsvpErr) return { ok: false, error: rsvpErr.message };

  const fireAt = new Date(new Date(ev.starts_at).getTime() - 2 * 60 * 60 * 1000);
  if (fireAt.getTime() > Date.now()) {
    await ctx.admin.from('reminders').insert({
      profile_id: ctx.profileId,
      kind: 'event_rsvp',
      fire_at: fireAt.toISOString(),
      payload: { event_id, title: ev.title, location: ev.location, source: 'agent' },
    });
  }

  await ctx.admin.from('events_log').insert({
    profile_id: ctx.profileId,
    event_name: 'event_rsvp',
    props: { event_id, source: 'agent' },
  });

  return { ok: true, data: { event_title: ev.title, starts_at: ev.starts_at } };
}
