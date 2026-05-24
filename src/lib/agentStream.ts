/**
 * Streams a Claude response from the agent-stream edge function.
 * Parses SSE manually because React Native has no EventSource.
 */
import { supabase } from './supabase';

export type AgentStreamEvent =
  | { type: 'meta'; thread_id: string; user_message_id: string }
  | { type: 'delta'; text: string }
  | { type: 'usage'; usage: Record<string, number> }
  | { type: 'done'; stop_reason: string }
  | { type: 'error'; message: string };

export interface StreamArgs {
  message: string;
  threadId?: string;
  onEvent: (event: AgentStreamEvent) => void;
  signal?: AbortSignal;
}

const AGENT_URL =
  process.env.EXPO_PUBLIC_AGENT_FN_URL ||
  (process.env.EXPO_PUBLIC_SUPABASE_URL
    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL.replace('supabase.co', 'functions.supabase.co')}/agent-stream`
    : 'http://localhost:54321/functions/v1/agent-stream');

export async function streamAgent({ message, threadId, onEvent, signal }: StreamArgs): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    onEvent({ type: 'error', message: 'Not signed in.' });
    return;
  }

  const res = await fetch(AGENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, thread_id: threadId }),
    signal,
  });

  if (!res.ok || !res.body) {
    onEvent({ type: 'error', message: `HTTP ${res.status}: ${await res.text().catch(() => '')}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const parsed = parseSseBlock(raw);
      if (parsed) onEvent(parsed);
    }
  }
}

function parseSseBlock(raw: string): AgentStreamEvent | null {
  const lines = raw.split('\n');
  let eventName = 'message';
  let dataStr = '';
  for (const line of lines) {
    if (line.startsWith('event: ')) eventName = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataStr += line.slice(6);
  }
  if (!dataStr) return null;
  try {
    const data = JSON.parse(dataStr);
    switch (eventName) {
      case 'meta':
        return { type: 'meta', thread_id: data.thread_id, user_message_id: data.user_message_id };
      case 'delta':
        return { type: 'delta', text: data.text };
      case 'usage':
        return { type: 'usage', usage: data };
      case 'done':
        return { type: 'done', stop_reason: data.stop_reason };
      case 'error':
        return { type: 'error', message: data.message };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
