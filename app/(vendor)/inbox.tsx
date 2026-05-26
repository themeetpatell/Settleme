import { View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase, type Conversation } from '@/lib/supabase';

type ConversationWithMember = Conversation & {
  member: { display_name: string | null; verified_at: string | null } | null;
};

export default function VendorInbox() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendor-inbox'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) return [];

      const { data: vuRows } = await supabase
        .from('vendor_users')
        .select('vendor_id')
        .eq('auth_user_id', uid);

      const vendorIds = (vuRows ?? []).map((v) => v.vendor_id as string);
      if (vendorIds.length === 0) return [];

      const { data: convs } = await supabase
        .from('conversations')
        .select('*, member:profiles(display_name, verified_at)')
        .in('vendor_id', vendorIds)
        .order('last_message_at', { ascending: false });
      return (convs as ConversationWithMember[] | null) ?? [];
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(vendor)/login');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text variant="display">Inbox</Text>
            <Text variant="body" muted className="mt-1">
              Members reaching out via SettleMe.
            </Text>
          </View>
          <Button title="Sign out" variant="ghost" onPress={signOut} />
        </View>

        <View className="mt-6 gap-3">
          {isLoading ? (
            <Text variant="small" muted>
              Loading…
            </Text>
          ) : (data ?? []).length === 0 ? (
            <EmptyState
              title="No inbound chats yet"
              body="When a SettleMe member starts a chat, it'll show up here."
              ctaLabel="Refresh"
              onCta={() => refetch()}
            />
          ) : (
            (data ?? []).map((c) => (
              <Pressable key={c.id} onPress={() => router.push(`/(vendor)/${c.id}`)}>
                <Card>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text variant="h3">{c.member?.display_name ?? 'SettleMe member'}</Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        {c.member?.verified_at ? (
                          <Badge label="Verified" tone="emerald" />
                        ) : (
                          <Badge label="Unverified" tone="terracotta" />
                        )}
                        {c.source === 'agent' ? (
                          <Badge label="from agent" tone="marigold" />
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
