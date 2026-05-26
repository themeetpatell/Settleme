// SettleMe — chat bubble for the in-app messaging thread.
//
// Members are rendered on the right (ink), vendors on the left (white card),
// system / agent messages centred with a muted look.

import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

interface ChatBubbleProps {
  body: string;
  senderKind: 'member' | 'vendor' | 'system' | 'agent';
  isOwn: boolean;
  createdAt: string;
}

export function ChatBubble({ body, senderKind, isOwn, createdAt }: ChatBubbleProps) {
  if (senderKind === 'system' || senderKind === 'agent') {
    return (
      <View className="my-1 items-center">
        <View className="max-w-[85%] rounded-2xl bg-marigold-100 px-4 py-2">
          <Text variant="caption" className="text-center text-marigold-900">
            {body}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`my-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isOwn
            ? 'bg-ink-900'
            : 'bg-white border border-ink-100 dark:bg-ink-800 dark:border-ink-700'
        }`}
      >
        <Text variant="body" className={isOwn ? 'text-canvas' : ''}>
          {body}
        </Text>
        <Text
          variant="caption"
          className={`mt-1 ${isOwn ? 'text-canvas/60' : 'text-ink-500'}`}
        >
          {new Date(createdAt).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}
