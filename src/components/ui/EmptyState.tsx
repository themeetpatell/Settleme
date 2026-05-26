import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  tone?: 'marigold' | 'emerald' | 'cobalt' | 'terracotta';
}

const toneBg: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  marigold: 'bg-marigold-100',
  emerald: 'bg-emerald-100',
  cobalt: 'bg-cobalt-100',
  terracotta: 'bg-terracotta-100',
};

const toneFg: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  marigold: '#9A5814',
  emerald: '#125E40',
  cobalt: '#163784',
  terracotta: '#8A3D2A',
};

export function EmptyState({
  title,
  body,
  ctaLabel,
  onCta,
  icon,
  iconName,
  tone = 'marigold',
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-12">
      <View className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${toneBg[tone]}`}>
        {icon ?? (
          <Ionicons name={iconName ?? 'sparkles-outline'} size={26} color={toneFg[tone]} />
        )}
      </View>
      <Text variant="h2" className="text-center">
        {title}
      </Text>
      {body ? (
        <Text variant="body" muted className="mt-2 max-w-xs text-center">
          {body}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <View className="mt-5">
          <Button title={ctaLabel} onPress={onCta} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
