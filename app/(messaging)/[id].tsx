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
import { useIdentity } from '@/state/identity';
import { warn } from '@/lib/haptics';

type ConversationWithVendor = Conversation & {
  vendor: { id: string; name: string; category: string; whatsapp: string | null } | null;
};

export default function ThreadScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = params.id;
  const profile = useIdentity((s) => s.profile);
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ConversationMessage>>(null);

  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, vendor:vendors(id, name, category, whatsapp)')
        .eq('id', conversationId)
        .single();
      return data as ConversationWithVendor | null;
    },
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
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
      .channel(`conv:${conversationId}`)
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
            ['messages', conversationId],
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
    if (!profile?.id || !conversationId) {
      warn();
      return;
    }
    const { error } = await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      sender_kind: 'member',
      sender_profile_id: profile.id,
      body,
    });
    if (error) {
      warn();
    }
  }

  const conv = conversationQuery.data;
  const messages = messagesQuery.data ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: conv?.vendor?.name ?? 'Chat' }} />
      <View className="border-b border-ink-100 px-6 pb-3 pt-2 dark:border-ink-700">
        <View className="flex-row items-center gap-2">
          <Text variant="h3">{conv?.vendor?.name ?? 'Vendor'}</Text>
          {conv?.vendor?.category ? <Badge label={conv.vendor.category} tone="ink" /> : null}
        </View>
        <Text variant="caption" muted className="mt-1">
          You're chatting via SettleMe. Replies are typically within 1 business day.
        </Text>
      </View>

      <View className="flex-1 px-4">
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState
              title="No messages yet"
              body="Send the first message — your vendor will be notified."
            />
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
                isOwn={item.sender_kind === 'member' && item.sender_profile_id === profile?.id}
                createdAt={item.created_at}
              />
            )}
            contentContainerStyle={{ paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <Composer placeholder="Write a message…" onSend={handleSend} />
    </Screen>
  );
}
