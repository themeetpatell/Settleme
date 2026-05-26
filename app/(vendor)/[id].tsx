import { useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChatBubble } from '@/features/messaging/ChatBubble';
import { Composer } from '@/features/messaging/Composer';
import { supabase, type Conversation, type ConversationMessage } from '@/lib/supabase';

type ConversationWithMember = Conversation & {
  member: { display_name: string | null; verified_at: string | null } | null;
};

export default function VendorThread() {
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = params.id;
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ConversationMessage>>(null);

  const meQuery = useQuery({
    queryKey: ['vendor-me'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) return null;
      const { data: vu } = await supabase
        .from('vendor_users')
        .select('id, vendor_id')
        .eq('auth_user_id', uid)
        .maybeSingle();
      return vu as { id: string; vendor_id: string } | null;
    },
  });

  const conversationQuery = useQuery({
    queryKey: ['vendor-conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, member:profiles(display_name, verified_at)')
        .eq('id', conversationId)
        .single();
      return data as ConversationWithMember | null;
    },
  });

  const messagesQuery = useQuery({
    queryKey: ['vendor-messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return (data as ConversationMessage[] | null) ?? [];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`vendor-conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ConversationMessage;
          queryClient.setQueryData<ConversationMessage[]>(
            ['vendor-messages', conversationId],
            (prev) => (prev ? [...prev, newMsg] : [newMsg]),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    if ((messagesQuery.data?.length ?? 0) === 0) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messagesQuery.data?.length]);

  async function handleSend(body: string) {
    const me = meQuery.data;
    if (!me?.id || !conversationId) return;
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      sender_kind: 'vendor',
      sender_vendor_user_id: me.id,
      body,
    });
  }

  const conv = conversationQuery.data;
  const messages = messagesQuery.data ?? [];
  const memberName = conv?.member?.display_name ?? 'SettleMe member';

  return (
    <Screen>
      <Stack.Screen options={{ title: memberName }} />
      <View className="border-b border-ink-100 px-6 pb-3 pt-2 dark:border-ink-700">
        <View className="flex-row items-center gap-2">
          <Text variant="h3">{memberName}</Text>
          {conv?.member?.verified_at ? (
            <Badge label="Verified" tone="emerald" />
          ) : (
            <Badge label="Unverified" tone="terracotta" />
          )}
        </View>
      </View>

      <View className="flex-1 px-4">
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState title="No messages yet" body="This conversation has no messages." />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatBubble
                body={item.body}
                senderKind={item.sender_kind}
                isOwn={item.sender_kind === 'vendor'}
                createdAt={item.created_at}
              />
            )}
            contentContainerStyle={{ paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <Composer placeholder="Reply to the member…" onSend={handleSend} />
    </Screen>
  );
}
