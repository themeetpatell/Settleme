import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface ProgressBarProps {
  value: number;
  total?: number;
  tone?: 'ink' | 'marigold' | 'emerald';
  height?: number;
  className?: string;
}

const fillClass: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  ink: 'bg-ink-900 dark:bg-sand-50',
  marigold: 'bg-marigold-500',
  emerald: 'bg-emerald-500',
};

export function ProgressBar({
  value,
  total = 1,
  tone = 'ink',
  height = 4,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, total > 0 ? value / total : 0));
  const animated = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: pct,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [pct, animated]);

  const width = animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      className={`overflow-hidden rounded-full bg-ink-100 dark:bg-ink-700 ${className ?? ''}`}
      style={{ height }}
    >
      <Animated.View className={`h-full rounded-full ${fillClass[tone]}`} style={{ width }} />
    </View>
  );
}
