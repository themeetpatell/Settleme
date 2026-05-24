import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption' | 'mono';

interface TextProps extends RNTextProps {
  variant?: Variant;
  muted?: boolean;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  display: 'font-display text-5xl leading-tight text-ink-900 dark:text-ink-50',
  h1: 'font-display text-3xl leading-snug text-ink-900 dark:text-ink-50',
  h2: 'font-display text-2xl leading-snug text-ink-900 dark:text-ink-50',
  h3: 'text-lg font-semibold leading-snug text-ink-900 dark:text-ink-50',
  body: 'text-base leading-relaxed text-ink-800 dark:text-ink-100',
  small: 'text-sm leading-relaxed text-ink-700 dark:text-ink-200',
  caption: 'text-xs uppercase tracking-widest text-ink-400 dark:text-ink-300',
  mono: 'text-sm text-ink-700 dark:text-ink-100',
};

export function Text({ variant = 'body', muted, className, ...rest }: TextProps) {
  const base = variantClass[variant];
  const mutedClass = muted ? ' text-ink-400 dark:text-ink-300' : '';
  return <RNText className={`${base}${mutedClass} ${className ?? ''}`} {...rest} />;
}
