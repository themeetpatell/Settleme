import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { MarkdownText } from '@/components/ui/MarkdownText';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

export function MessageBubble({ role, text, pending }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <View className="mb-2.5 self-end max-w-[88%] rounded-3xl rounded-br-lg bg-ink-900 px-4 py-3">
        <Text variant="body" className="text-sand-50">
          {text}
        </Text>
      </View>
    );
  }

  if (!text && pending) {
    return (
      <View className="mb-2.5 self-start rounded-3xl rounded-bl-lg border border-ink-100 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-800">
        <View className="flex-row items-center gap-1">
          <View className="h-1.5 w-1.5 rounded-full bg-ink-400" />
          <View className="h-1.5 w-1.5 rounded-full bg-ink-400" />
          <View className="h-1.5 w-1.5 rounded-full bg-ink-400" />
        </View>
      </View>
    );
  }

  return (
    <View className="mb-2.5 self-start max-w-[92%] rounded-3xl rounded-bl-lg border border-ink-100 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-800">
      <MarkdownText source={text} />
      {pending ? (
        <Text variant="body" tone="muted">
          ▍
        </Text>
      ) : null}
    </View>
  );
}
