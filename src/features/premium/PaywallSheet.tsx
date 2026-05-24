import { Modal, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

const BULLETS = [
  'AI agent that does the paperwork, not just talk',
  'Visa renewal automation + deadline alerts',
  'Tax filing helper (UAE, India, NRE/NRO)',
  'Priority access to vetted lawyers + PROs',
  'Family + dependents planner',
];

export function PaywallSheet({ visible, onClose, onSubscribe }: PaywallSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-ink-900/50" />
      <View className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-canvas dark:bg-ink-900 px-6 pt-6 pb-10">
        <Badge label="SettleMe Premium" tone="marigold" />
        <Text variant="h1" className="mt-3">
          Let SettleMe do the work.
        </Text>
        <Text variant="body" muted className="mt-2">
          AED 49 / month. Cancel anytime. Pays for itself in one avoided agent fee.
        </Text>

        <View className="mt-6 gap-2">
          {BULLETS.map((b) => (
            <View key={b} className="flex-row gap-2">
              <Text variant="body">✓</Text>
              <Text variant="body" className="flex-1">
                {b}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-8 gap-2">
          <Button title="Start free trial" onPress={onSubscribe} fullWidth size="lg" />
          <Button title="Not now" onPress={onClose} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}
