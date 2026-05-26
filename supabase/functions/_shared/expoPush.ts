// SettleMe — Expo Push helper.
//
// POSTs batched messages to Expo's push endpoint. Honors token-expiry tickets
// and deletes DeviceNotRegistered tokens via the supplied admin client.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoTicket[];
  errors?: { code: string; message: string }[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function sendExpoPush(
  admin: SupabaseClient,
  messages: ExpoPushMessage[],
): Promise<{ sent: number; failed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const deadTokens: string[] = [];

  for (const batch of chunk(messages, BATCH_SIZE)) {
    let res: Response;
    try {
      res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });
    } catch (err) {
      console.error('[expoPush] network error', err);
      failed += batch.length;
      continue;
    }

    if (!res.ok) {
      console.error('[expoPush] non-ok response', res.status, await res.text().catch(() => ''));
      failed += batch.length;
      continue;
    }

    const json = (await res.json().catch(() => ({}))) as ExpoPushResponse;
    const tickets = json.data ?? [];
    tickets.forEach((ticket, i) => {
      if (ticket.status === 'ok') {
        sent += 1;
      } else {
        failed += 1;
        const code = ticket.details?.error;
        if (code === 'DeviceNotRegistered') {
          deadTokens.push(batch[i].to);
        }
      }
    });
  }

  if (deadTokens.length > 0) {
    await admin.from('push_tokens').delete().in('expo_token', deadTokens);
  }

  return { sent, failed };
}
