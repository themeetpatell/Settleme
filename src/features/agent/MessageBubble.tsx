import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

export function MessageBubble({ role, text, pending }: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <View className="mb-3 self-end max-w-[85%] rounded-3xl rounded-br-md bg-ink-900 px-4 py-3">
        <Text variant="body" className="text-canvas">
          {text}
        </Text>
      </View>
    );
  }
  return (
    <View className="mb-3 self-start max-w-[92%] rounded-3xl rounded-bl-md bg-white border border-ink-100 px-4 py-3 dark:bg-ink-800 dark:border-ink-700">
      <Text variant="body">
        {text}
        {pending ? '▍' : ''}
      </Text>
    </View>
  );
}
