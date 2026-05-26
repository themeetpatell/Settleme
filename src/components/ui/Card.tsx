import { useRef } from 'react';
import {
  Pressable,
  View,
  Animated,
  type ViewProps,
  type PressableProps,
} from 'react-native';
import type { ReactNode } from 'react';

type Variant = 'default' | 'hero' | 'tinted' | 'ghost' | 'outline';
type Tone = 'marigold' | 'emerald' | 'cobalt' | 'terracotta' | 'ink';
type Elevation = 0 | 1 | 2 | 3 | 4;

interface CardProps extends Omit<ViewProps, 'children'> {
  children: ReactNode;
  onPress?: PressableProps['onPress'];
  className?: string;
  variant?: Variant;
  tone?: Tone;
  elevation?: Elevation;
  flat?: boolean;
  pressable?: boolean;
}

const tonedBg: Record<Tone, string> = {
  marigold: 'bg-marigold-100 border-marigold-200 dark:bg-marigold-900/40 dark:border-marigold-800',
  emerald: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800',
  cobalt: 'bg-cobalt-100 border-cobalt-200 dark:bg-cobalt-900/40 dark:border-cobalt-800',
  terracotta:
    'bg-terracotta-100 border-terracotta-200 dark:bg-terracotta-900/40 dark:border-terracotta-800',
  ink: 'bg-ink-900 border-ink-800',
};

const elevationClass: Record<Elevation, string> = {
  0: '',
  1: 'shadow-e1',
  2: 'shadow-e2',
  3: 'shadow-e3',
  4: 'shadow-e4',
};

function variantBase(variant: Variant, tone: Tone | undefined): string {
  if (variant === 'tinted' && tone) return `${tonedBg[tone]} border`;
  if (variant === 'hero') return 'bg-ink-900 dark:bg-ink-800 border border-ink-800';
  if (variant === 'ghost')
    return 'bg-transparent border border-ink-100/70 dark:border-ink-700';
  if (variant === 'outline') return 'bg-transparent border border-ink-200 dark:border-ink-700';
  return 'bg-white border border-ink-100 dark:bg-ink-800 dark:border-ink-700';
}

export function Card({
  children,
  onPress,
  className,
  variant = 'default',
  tone,
  elevation,
  flat,
  pressable,
  ...rest
}: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const interactive = !!onPress || pressable;
  const effectiveElevation: Elevation =
    elevation ?? (variant === 'hero' ? 3 : flat ? 0 : 1);
  const base = `rounded-3xl p-5 ${variantBase(variant, tone)} ${elevationClass[effectiveElevation]} ${className ?? ''}`;

  if (interactive) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={() =>
            Animated.spring(scale, {
              toValue: 0.98,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
              bounciness: 4,
            }).start()
          }
          className={base}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
