// SettleMe — renders inline cards for agent tool_use / tool_result blocks.

import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { tap, success, warn } from '@/lib/haptics';

export interface UiToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: { ok: boolean; data: unknown; error: string | null };
}

interface ToolBlockProps {
  tool: UiToolUse;
  memberProfileId: string | null;
}

interface VendorMini {
  id: string;
  name: string;
  category: string;
  description: string | null;
  rating: number;
  review_count: number;
  verified_at: string | null;
}

function HumanToolLabel({ name }: { name: string }) {
  const map: Record<string, string> = {
    search_vendors: 'Finding trusted vendors…',
    start_vendor_message: 'Opening a chat for you…',
    set_visa_reminder: 'Setting a reminder…',
    find_community_answers: 'Searching the community…',
    rsvp_event: 'RSVPing you…',
  };
  return (
    <Text variant="caption" muted>
      {map[name] ?? name}
    </Text>
  );
}

export function ToolBlock({ tool, memberProfileId }: ToolBlockProps) {
  const router = useRouter();

  if (!tool.result) {
    return (
      <Card className="my-1">
        <Badge label="SettleMe agent" tone="marigold" />
        <View className="mt-2">
          <HumanToolLabel name={tool.name} />
        </View>
      </Card>
    );
  }

  if (!tool.result.ok) {
    return (
      <Card className="my-1">
        <Badge label="Tool error" tone="terracotta" />
        <Text variant="small" muted className="mt-2">
          {tool.result.error ?? 'Something went wrong with that step.'}
        </Text>
      </Card>
    );
  }

  switch (tool.name) {
    case 'search_vendors': {
      const data = (tool.result.data ?? {}) as { vendors?: VendorMini[]; city?: string; category?: string };
      const vendors = data.vendors ?? [];
      if (vendors.length === 0) {
        return (
          <Card className="my-1">
            <Badge label="Trusted vendors" tone="emerald" />
            <Text variant="small" muted className="mt-2">
              No vendors yet in this category for {data.city ?? 'your city'}.
            </Text>
          </Card>
        );
      }
      return (
        <Card className="my-1">
          <Badge label={`Trusted ${data.category ?? 'vendors'} in ${data.city ?? 'your city'}`} tone="emerald" />
          <View className="mt-3 gap-2">
            {vendors.map((v) => (
              <View
                key={v.id}
                className="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-700 dark:bg-ink-800"
              >
                <Text variant="h3">{v.name}</Text>
                <Text variant="caption" muted className="mt-1">
                  ⭐ {v.rating.toFixed(1)} · {v.review_count} reviews{v.verified_at ? ' · Verified' : ''}
                </Text>
                {v.description ? (
                  <Text variant="small" muted className="mt-1">
                    {v.description}
                  </Text>
                ) : null}
                <View className="mt-2">
                  <Button
                    title="Start chat"
                    size="sm"
                    onPress={async () => {
                      if (!memberProfileId) {
                        warn();
                        return;
                      }
                      tap();
                      try {
                        const draft = `Hi ${v.name.split(' ')[0]}, I'd like help with ${v.category}. Sent via SettleMe.`;
                        const { data: existing } = await supabase
                          .from('conversations')
                          .select('id')
                          .eq('member_id', memberProfileId)
                          .eq('vendor_id', v.id)
                          .maybeSingle();
                        let convId = existing?.id as string | undefined;
                        if (!convId) {
                          const { data: created, error } = await supabase
                            .from('conversations')
                            .insert({ member_id: memberProfileId, vendor_id: v.id, source: 'agent' })
                            .select('id')
                            .single();
                          if (error || !created) {
                            warn();
                            return;
                          }
                          convId = created.id as string;
                        }
                        await supabase.from('conversation_messages').insert({
                          conversation_id: convId,
                          sender_kind: 'member',
                          sender_profile_id: memberProfileId,
                          body: draft,
                        });
                        success();
                        router.push(`/(messaging)/${convId}`);
                      } catch {
                        warn();
                      }
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>
      );
    }

    case 'start_vendor_message': {
      const data = (tool.result.data ?? {}) as { conversation_id?: string; vendor_name?: string };
      return (
        <Card className="my-1">
          <Badge label="Chat opened" tone="emerald" />
          <Text variant="h3" className="mt-2">
            Message sent to {data.vendor_name ?? 'the vendor'}
          </Text>
          <View className="mt-3">
            <Button
              title="Open thread"
              size="sm"
              onPress={() => {
                tap();
                if (data.conversation_id) router.push(`/(messaging)/${data.conversation_id}`);
              }}
            />
          </View>
        </Card>
      );
    }

    case 'set_visa_reminder': {
      const data = (tool.result.data ?? {}) as { fire_at?: string; days_before?: number };
      const date = data.fire_at ? new Date(data.fire_at) : null;
      return (
        <Card className="my-1">
          <Badge label="Reminder set" tone="emerald" />
          <Text variant="h3" className="mt-2">
            We'll ping you {data.days_before ?? 30} days before
          </Text>
          {date ? (
            <Text variant="caption" muted className="mt-1">
              First nudge: {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          ) : null}
        </Card>
      );
    }

    case 'find_community_answers': {
      const data = (tool.result.data ?? {}) as {
        qa?: { question: string; category: string }[];
        posts?: { body: string }[];
      };
      const total = (data.qa?.length ?? 0) + (data.posts?.length ?? 0);
      return (
        <Card className="my-1">
          <Badge label="Community knowledge" tone="ink" />
          <Text variant="small" muted className="mt-2">
            Found {total} related {total === 1 ? 'answer' : 'answers'} from the SettleMe knowledge base.
          </Text>
        </Card>
      );
    }

    case 'rsvp_event': {
      const data = (tool.result.data ?? {}) as { event_title?: string; starts_at?: string };
      return (
        <Card className="my-1">
          <Badge label="You're going" tone="emerald" />
          <Text variant="h3" className="mt-2">
            {data.event_title ?? 'Event'}
          </Text>
          <View className="mt-3">
            <Pressable onPress={() => router.push('/(tabs)/events')}>
              <Text variant="small" className="text-emerald-700">
                See in Events →
              </Text>
            </Pressable>
          </View>
        </Card>
      );
    }

    default:
      return null;
  }
}
