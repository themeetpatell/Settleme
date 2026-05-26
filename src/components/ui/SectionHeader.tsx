import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  eyebrow,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <View className={`flex-row items-end justify-between gap-3 ${className ?? ''}`}>
      <View className="flex-1">
        {eyebrow ? (
          <Text variant="eyebrow" className="mb-1.5">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="h2">{title}</Text>
        {subtitle ? (
          <Text variant="small" muted className="mt-1">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}
