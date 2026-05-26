import { useEffect, useRef } from 'react';
import { Animated, View, type ViewProps } from 'react-native';

type SkeletonWidth = number | `${number}%` | 'auto';

interface SkeletonProps extends ViewProps {
  width?: SkeletonWidth;
  height?: number;
  radius?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-ink-100 dark:bg-ink-700 ${className ?? ''}`}
      style={[{ width, height, borderRadius: radius, opacity }, style]}
      {...rest}
    />
  );
}

export function SkeletonStack({ rows = 3, spacing = 12 }: { rows?: number; spacing?: number }) {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={64} radius={16} />
      ))}
    </View>
  );
}
