import { Pressable, View } from 'react-native';
import { Text } from './Text';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'emerald' | 'marigold' | 'terracotta';
}

const toneInactive: Record<NonNullable<ChipProps['tone']>, string> = {
  default: 'bg-ink-50 border-ink-100 dark:bg-ink-800 dark:border-ink-700',
  emerald: 'bg-emerald-100 border-emerald-100',
  marigold: 'bg-marigold-100 border-marigold-100',
  terracotta: 'bg-terracotta-100 border-terracotta-100',
};

const toneActive = 'bg-ink-900 border-ink-900';

export function Chip({ label, active, onPress, tone = 'default' }: ChipProps) {
  const className = `rounded-full border px-3 py-1.5 ${active ? toneActive : toneInactive[tone]}`;
  const textClass = active ? 'text-canvas font-medium' : 'text-ink-700 dark:text-ink-100 font-medium';
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={className}>
        <Text variant="small" className={textClass}>
          {label}
        </Text>
      </Pressable>
    );
  }
  return (
    <View className={className}>
      <Text variant="small" className={textClass}>
        {label}
      </Text>
    </View>
  );
}
