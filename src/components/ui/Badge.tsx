import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';

type Tone = 'default' | 'emerald' | 'marigold' | 'terracotta' | 'ink' | 'cobalt';
type Size = 'sm' | 'md';

interface BadgeProps {
  label: string;
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}

const toneClass: Record<Tone, { bg: string; fg: string; dot: string }> = {
  default: {
    bg: 'bg-ink-100 dark:bg-ink-700',
    fg: 'text-ink-700 dark:text-ink-100',
    dot: 'bg-ink-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    fg: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  marigold: {
    bg: 'bg-marigold-100 dark:bg-marigold-900/40',
    fg: 'text-marigold-700 dark:text-marigold-300',
    dot: 'bg-marigold-500',
  },
  terracotta: {
    bg: 'bg-terracotta-100 dark:bg-terracotta-900/40',
    fg: 'text-terracotta-700 dark:text-terracotta-300',
    dot: 'bg-terracotta-500',
  },
  cobalt: {
    bg: 'bg-cobalt-100 dark:bg-cobalt-900/40',
    fg: 'text-cobalt-700 dark:text-cobalt-300',
    dot: 'bg-cobalt-500',
  },
  ink: { bg: 'bg-ink-900', fg: 'text-sand-50', dot: 'bg-marigold-400' },
};

const sizeClass: Record<Size, string> = {
  sm: 'h-6 px-2.5 rounded-full',
  md: 'h-7 px-3 rounded-full',
};

export function Badge({
  label,
  tone = 'default',
  size = 'sm',
  dot,
  icon,
  className,
}: BadgeProps) {
  const t = toneClass[tone];
  return (
    <View
      className={`flex-row items-center self-start ${t.bg} ${sizeClass[size]} ${className ?? ''}`}
    >
      {dot ? <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${t.dot}`} /> : null}
      {icon ? <View className="mr-1.5">{icon}</View> : null}
      <Text
        variant="caption"
        className={`font-sans-semibold uppercase tracking-[0.12em] ${t.fg}`}
      >
        {label}
      </Text>
    </View>
  );
}
