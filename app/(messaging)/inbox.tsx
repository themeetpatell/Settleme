import { View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { supabase, type Conversation } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';
import { tap } from '@/lib/haptics';

type ConversationWithVendor = Conversation & {
  vendor: { id: string; name: string; category: string; cover_url: string | null } | null;
};

export default function InboxScreen() {
  const router = useRouter();
  const profile = useIdentity((s) => s.profile);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, vendor:vendors(id, name, category, cover_url)')
        .eq('member_id', profile!.id)
        .order('last_message_at', { ascending: false });
      return (data as ConversationWithVendor[] | null) ?? [];
    },
  });

  return (
    <Screen scroll>
      <View className="px-6 pt-4">
        <Text variant="display">Messages</Text>
        <Text variant="body" muted className="mt-1">
          Your conversations with SettleMe-trusted vendors.
        </Text>

        <View className="mt-6 gap-3">
          {isLoading ? (
            <Text variant="small" muted>
              Loading…
            </Text>
          ) : (data ?? []).length === 0 ? (
            <EmptyState
              title="No chats yet"
              body="Ask SettleMe to find you a vendor — the agent will open a chat for you."
            />
          ) : (
            (data ?? []).map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  tap();
                  router.push(`/(messaging)/${c.id}`);
                }}
              >
                <Card>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text variant="h3">{c.vendor?.name ?? 'Vendor'}</Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <Badge label={c.vendor?.category ?? '—'} tone="ink" />
                        {c.source === 'agent' ? (
                          <Badge label="opened by agent" tone="marigold" />
                        ) : null}
                      </View>
                      <Text variant="small" muted className="mt-2" numberOfLines={2}>
                        {c.last_message_preview ?? 'No messages yet.'}
                      </Text>
                    </View>
                    <Text variant="caption" muted>
                      {new Date(c.last_message_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
