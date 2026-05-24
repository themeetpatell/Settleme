import { View } from 'react-native';
import { Text } from './Text';

interface BadgeProps {
  label: string;
  tone?: 'default' | 'emerald' | 'marigold' | 'terracotta';
}

const toneClass: Record<NonNullable<BadgeProps['tone']>, { bg: string; fg: string }> = {
  default: { bg: 'bg-ink-100 dark:bg-ink-700', fg: 'text-ink-700 dark:text-ink-100' },
  emerald: { bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  marigold: { bg: 'bg-marigold-100', fg: 'text-marigold-600' },
  terracotta: { bg: 'bg-terracotta-100', fg: 'text-terracotta-500' },
};

export function Badge({ label, tone = 'default' }: BadgeProps) {
  const { bg, fg } = toneClass[tone];
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${bg}`}>
      <Text variant="caption" className={fg}>
        {label}
      </Text>
    </View>
  );
}
