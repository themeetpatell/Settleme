// SettleMe — agent-stream edge function.
//
// Streams a Claude response to the SettleMe AI agent for the current user.
// Auth-gated by Supabase JWT. Persists the full assistant message (text +
// tool_use + tool_result blocks) so the conversation can be rehydrated later.
//
// Request body:
//   { thread_id?: string, message: string }
//
// Response: text/event-stream
//   event: meta         data: {"thread_id":"...","user_message_id":"..."}
//   event: delta        data: {"text":"..."}
//   event: tool_use     data: {"id":"...","name":"...","input":{...}}
//   event: tool_result  data: {"tool_use_id":"...","ok":true,"data":...}
//   event: usage        data: {...}
//   event: done         data: {"stop_reason":"..."}
//   event: error        data: {"message":"..."}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.32.1';
import { corsHeaders } from '../_shared/cors.ts';
import { AGENT_TOOLS, runAgentTool, type AgentIdentity } from '../_shared/agentTools.ts';

const MODEL = 'claude-opus-4-7';
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are SettleMe — the AI life navigator for people who have moved countries.

You serve the diaspora: their first 90 days surviving a new country, their next 2 years thriving, and every life question that comes up in between. You know visa rules, banking, taxes, housing, schools, healthcare, remittance, cultural integration, and community.

Voice
- Sharp. Warm. Operator-grade. Talk like a trusted older sibling who lived through this five years ago.
- Plain English. No legalese. No corporate jargon. No filler.
- Short paragraphs. Numbered steps where steps matter. Tables for comparison.
- If you don't know the answer for the user's specific corridor, say so. Recommend they ask the community.

What you do
1. Answer the user's question completely. Make a recommendation, then list edge cases.
2. Always anchor to the user's corridor (origin country → destination country → destination city). If their identity graph is missing context, ask one targeted question before answering.
3. When the question is regulatory (visa, tax, immigration), explain rules first, then suggest a human professional if needed.
4. When the question is social or cultural, surface specifics — names, places, areas.
5. When the question requires action, break it into a numbered checklist with timelines.

Tools — use them
You have real tools. Prefer calling them over making things up.
- Recommending a vendor? Call search_vendors to fetch real ones for the user's city — never invent a name or phone number.
- User wants to contact a vendor? After search_vendors, call start_vendor_message with a short, polite first message in the user's voice that includes their corridor context. Tell the user "I've opened a chat with <vendor> — tap to open it."
- User wants a visa renewal reminder? Call set_visa_reminder. Default 30 days unless they ask for a specific window.
- Question likely answered before? Call find_community_answers first.
- User wants to attend an event? Call rsvp_event with the event id.

What you don't do
- Don't give legal advice on contested situations. Recommend a SettleMe Trusted lawyer.
- Don't recommend products with affiliate motivation. Recommend what is actually best.

Format
- Use Markdown. Headers, bullets, tables welcome.
- For visa / tax / financial answers, end with a one-line "Pro tip" the user could not Google.

You are the most trusted resource in the user's diaspora. Earn it every answer.`;

interface ProfileRow {
  display_name: string | null;
  verified_at: string | null;
}

interface QARow {
  question: string;
  answer_md: string;
}

function identityBlock(profile: ProfileRow | null, identity: AgentIdentity | null): string {
  if (!identity) {
    return `## The user
${profile?.display_name ?? 'A new SettleMe member'} — no identity graph yet. Ask one short clarifying question to learn their corridor (origin → destination) before answering anything corridor-specific.`;
  }
  return `## The user
- Name: ${profile?.display_name ?? 'SettleMe member'}
- Corridor: ${identity.origin_country ?? '?'} → ${identity.dest_country ?? '?'} (${identity.dest_city ?? 'unknown city'})
- Visa: ${identity.visa_status ?? 'unknown'}${identity.visa_expires_on ? `, renews ${identity.visa_expires_on}` : ''}
- Verified: ${profile?.verified_at ? 'yes' : 'no'}

Anchor every answer to this corridor and stage of life. Reference their city specifically.`;
}

function relevantQAKeywords(message: string): string[] {
  const m = message.toLowerCase();
  const keys: string[] = [];
  const cues: Record<string, string[]> = {
    'bank|account|nre|nro|hdfc|emirates nbd|mashreq': ['banking'],
    'send money|remit|remittance|wise|lulu|exchange|transfer': ['remittance'],
    'emirates id|eid|medical test|salem|tasheel|icp|amer': ['eid', 'visa'],
    'visa|stamping|labour contract|mohre|residence': ['visa'],
    'tax|vat|corporate tax|tax residency': ['tax'],
    'house|rent|apartment|jvc|mirdif|damac|greens|discovery': ['housing'],
    'school|kg|cbse|icse|gems|dps': ['school', 'education'],
  };
  for (const [pattern, k] of Object.entries(cues)) {
    if (new RegExp(pattern).test(m)) keys.push(...k);
  }
  return [...new Set(keys)];
}

type AssistantBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };

type UserBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

type ChatMessage =
  | { role: 'user'; content: UserBlock[] }
  | { role: 'assistant'; content: AssistantBlock[] };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const body = await req.json().catch(() => null);
  const message: string | undefined = body?.message;
  const incomingThreadId: string | undefined = body?.thread_id;
  if (!message || typeof message !== 'string') {
    return new Response('Missing message', { status: 400, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

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
    .select('id, display_name, verified_at')
    .eq('auth_user_id', user.id)
    .single();
  if (!profile) {
    return new Response('Profile missing', { status: 404, headers: corsHeaders });
  }

  const { data: identity } = await admin
    .from('identity_graph')
    .select(
      'origin_country, dest_country, dest_city, corridor, arrival_date, visa_status, visa_expires_on, family_size, dependents, preferred_language',
    )
    .eq('profile_id', profile.id)
    .maybeSingle();

  let threadId = incomingThreadId;
  if (!threadId) {
    const { data: t } = await admin
      .from('ai_threads')
      .insert({ profile_id: profile.id, title: message.slice(0, 64) })
      .select('id')
      .single();
    threadId = t!.id;
  }

  const { data: userMsg } = await admin
    .from('ai_messages')
    .insert({
      thread_id: threadId,
      role: 'user',
      content: [{ type: 'text', text: message }],
    })
    .select('id')
    .single();

  await admin.from('events_log').insert({
    profile_id: profile.id,
    event_name: 'agent_question',
    props: { thread_id: threadId, length: message.length },
  });

  // ----- Messages history (last 12, normalize content) -----
  const { data: history } = await admin
    .from('ai_messages')
    .select('role, content')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(12);

  const messages: ChatMessage[] = (history ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const content = m.content as unknown;
      if (Array.isArray(content)) {
        return { role: m.role as 'user' | 'assistant', content: content as never };
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: [{ type: 'text', text: String(content ?? '') }] as never,
      };
    });

  // ----- Retrieval (lightweight keyword QA, kept for cheap context) -----
  const keywords = relevantQAKeywords(message);
  let qaContext = '';
  if (keywords.length > 0) {
    const { data: qa } = (await admin
      .from('qa_questions')
      .select('question, answer_md')
      .eq('corridor', identity?.corridor ?? 'in_ae')
      .overlaps('keywords', keywords)
      .limit(3)) as { data: QARow[] | null };
    if (qa && qa.length > 0) {
      qaContext =
        '\n\n## SettleMe knowledge base — relevant entries\n\n' +
        qa.map((q) => `### ${q.question}\n${q.answer_md}`).join('\n\n---\n\n');
    }
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

  const system = [
    {
      type: 'text' as const,
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    },
    {
      type: 'text' as const,
      text:
        identityBlock(profile, (identity as AgentIdentity | null) ?? null) + qaContext,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  const toolCtx = {
    admin,
    profileId: profile.id as string,
    identity: (identity as AgentIdentity | null) ?? null,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send('meta', { thread_id: threadId, user_message_id: userMsg!.id });

      let stopReason: string | null = null;
      let lastUsage: unknown = null;
      let iteration = 0;

      try {
        while (iteration < MAX_TOOL_ITERATIONS) {
          iteration += 1;

          const result = anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages: messages as never,
            tools: AGENT_TOOLS as never,
          });

          for await (const event of result) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              send('delta', { text: event.delta.text });
            } else if (event.type === 'message_delta') {
              if (event.usage) lastUsage = event.usage;
              if (event.delta.stop_reason) stopReason = event.delta.stop_reason;
            }
          }

          const finalMsg = await result.finalMessage();
          const assistantBlocks: AssistantBlock[] = (finalMsg.content as unknown[])
            .filter((b) => {
              const block = b as { type: string };
              return block.type === 'text' || block.type === 'tool_use';
            })
            .map((b) => {
              const block = b as AssistantBlock;
              return block.type === 'text'
                ? { type: 'text', text: block.text }
                : {
                    type: 'tool_use',
                    id: block.id,
                    name: block.name,
                    input: block.input ?? {},
                  };
            });

          await admin.from('ai_messages').insert({
            thread_id: threadId,
            role: 'assistant',
            content: assistantBlocks,
            model: MODEL,
            usage: lastUsage,
          });

          messages.push({ role: 'assistant', content: assistantBlocks });

          const toolUses = assistantBlocks.filter(
            (b): b is Extract<AssistantBlock, { type: 'tool_use' }> => b.type === 'tool_use',
          );

          if (stopReason !== 'tool_use' || toolUses.length === 0) {
            break;
          }

          const toolResultBlocks: UserBlock[] = [];
          for (const tu of toolUses) {
            send('tool_use', { id: tu.id, name: tu.name, input: tu.input });

            const res = await runAgentTool(toolCtx, tu.name, tu.input);
            send('tool_result', {
              tool_use_id: tu.id,
              name: tu.name,
              ok: res.ok,
              data: res.data ?? null,
              error: res.error ?? null,
            });

            await admin.from('events_log').insert({
              profile_id: profile.id,
              event_name: 'agent.tool_use',
              props: { tool: tu.name, ok: res.ok, error: res.error ?? null },
            });

            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify(res.ok ? res.data : { error: res.error }),
              is_error: !res.ok,
            });
          }

          await admin.from('ai_messages').insert({
            thread_id: threadId,
            role: 'user',
            content: toolResultBlocks,
          });

          messages.push({ role: 'user', content: toolResultBlocks });
        }

        await admin
          .from('ai_threads')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', threadId);

        send('usage', lastUsage ?? {});
        send('done', { stop_reason: stopReason ?? 'end_turn', iterations: iteration });
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
});
