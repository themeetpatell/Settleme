import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { AgentChat } from '@/features/agent/AgentChat';

export default function AskTab() {
  return (
    <Screen>
      <View className="px-6 pt-6 pb-2">
        <Badge label="Beta · streams from Claude" tone="marigold" />
        <Text variant="display" className="mt-2">
          Ask SettleMe.
        </Text>
      </View>
      <View className="flex-1">
        <AgentChat />
      </View>
    </Screen>
  );
}
