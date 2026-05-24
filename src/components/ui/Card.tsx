import { Pressable, View, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';

interface CardProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  flat?: boolean;
}

export function Card({ children, onPress, className, flat, ...rest }: CardProps) {
  const base = `rounded-3xl bg-white border border-ink-100 dark:bg-ink-800 dark:border-ink-700 ${
    flat ? '' : 'shadow-sm shadow-ink-900/5'
  } p-4 ${className ?? ''}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80`}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
