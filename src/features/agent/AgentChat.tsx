import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { streamAgent } from '@/lib/agentStream';
import { MessageBubble } from './MessageBubble';
import { ToolBlock, type UiToolUse } from './ToolBlock';
import { tap, success, warn } from '@/lib/haptics';
import { useIdentity } from '@/state/identity';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tools: UiToolUse[];
  pending?: boolean;
}

const SUGGESTIONS = [
  'Find me a PRO for Emirates ID and start a chat with the best one.',
  'Cheapest way to send AED 10,000 to India this week?',
  'Remind me 60 days before my visa expires.',
  'Best areas in Dubai for a young Indian family?',
];

export function AgentChat() {
  const identity = useIdentity((s) => s.identity);
  const profile = useIdentity((s) => s.profile);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<FlatList<UiMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);

  const intro = useMemo(() => {
    const city = identity?.dest_city ?? 'your city';
    const name = profile?.display_name?.split(' ')[0] ?? 'there';
    return `Hi ${name}. I'm SettleMe. Ask me anything about life in ${city} — banking, visa, taxes, schools, neighbourhoods, community. I'll act on your behalf where I can: find vendors, open chats, set reminders.`;
  }, [identity, profile]);

  const askWith = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      tap();
      const userMsg: UiMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: trimmed,
        tools: [],
      };
      const asstId = `a_${Date.now()}`;
      const asstMsg: UiMessage = {
        id: asstId,
        role: 'assistant',
        text: '',
        tools: [],
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, asstMsg]);
      setDraft('');
      setStreaming(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        await streamAgent({
          message: trimmed,
          threadId,
          signal: ctrl.signal,
          onEvent: (e) => {
            if (e.type === 'meta') {
              setThreadId(e.thread_id);
            } else if (e.type === 'delta') {
              setMessages((prev) =>
                prev.map((m) => (m.id === asstId ? { ...m, text: m.text + e.text } : m)),
              );
            } else if (e.type === 'tool_use') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstId
                    ? {
                        ...m,
                        tools: [...m.tools, { id: e.id, name: e.name, input: e.input }],
                      }
                    : m,
                ),
              );
            } else if (e.type === 'tool_result') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstId
                    ? {
                        ...m,
                        tools: m.tools.map((t) =>
                          t.id === e.tool_use_id
                            ? { ...t, result: { ok: e.ok, data: e.data, error: e.error } }
                            : t,
                        ),
                      }
                    : m,
                ),
              );
            } else if (e.type === 'done') {
              setMessages((prev) =>
                prev.map((m) => (m.id === asstId ? { ...m, pending: false } : m)),
              );
              success();
            } else if (e.type === 'error') {
              warn();
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstId
                    ? { ...m, text: `Sorry, that didn't work. (${e.message})`, pending: false }
                    : m,
                ),
              );
            }
          },
        });
      } catch (err) {
        warn();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  text: `Sorry, that didn't work. ${err instanceof Error ? err.message : ''}`,
                  pending: false,
                }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, threadId],
  );

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-1 px-4">
        {messages.length === 0 ? (
          <View className="flex-1 justify-end pb-2">
            <Card className="mb-4">
              <Text variant="body">{intro}</Text>
            </Card>
            <Text variant="caption" className="mb-2 px-2">
              Try
            </Text>
            <View className="gap-2">
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => askWith(s)}
                  className="rounded-2xl border border-ink-100 bg-white px-4 py-3 active:opacity-80 dark:bg-ink-800 dark:border-ink-700"
                >
                  <Text variant="small">{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <View>
                <MessageBubble role={item.role} text={item.text} pending={item.pending} />
                {item.tools.length > 0 ? (
                  <View className="my-1 gap-1 pr-8">
                    {item.tools.map((t) => (
                      <ToolBlock key={t.id} tool={t} memberProfileId={profile?.id ?? null} />
                    ))}
                  </View>
                ) : null}
              </View>
            )}
            contentContainerStyle={{ paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View className="flex-row items-end gap-2 pb-3 pt-2">
          <View className="flex-1">
            <Input
              placeholder="Ask SettleMe…"
              value={draft}
              onChangeText={setDraft}
              multiline
              onSubmitEditing={() => askWith(draft)}
              returnKeyType="send"
              blurOnSubmit
            />
          </View>
          <Pressable
            onPress={() => askWith(draft)}
            disabled={!draft.trim() || streaming}
            className={`h-12 w-12 items-center justify-center rounded-2xl ${
              !draft.trim() || streaming ? 'bg-ink-200 dark:bg-ink-700' : 'bg-ink-900'
            }`}
          >
            <Ionicons name="arrow-up" size={20} color="#FBF8F2" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
