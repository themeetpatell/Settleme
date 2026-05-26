import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant =
  | 'display-xl'
  | 'display-lg'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'eyebrow'
  | 'body-lg'
  | 'body'
  | 'small'
  | 'caption'
  | 'mono';

type Tone = 'default' | 'muted' | 'subtle' | 'inverse' | 'accent' | 'success' | 'danger';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  italic?: boolean;
  /** Shorthand for tone="muted". */
  muted?: boolean;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  'display-xl':
    'font-display text-[56px] leading-[1.04] tracking-tight text-ink-900 dark:text-sand-50',
  'display-lg':
    'font-display text-[44px] leading-[1.06] tracking-tight text-ink-900 dark:text-sand-50',
  display:
    'font-display text-[36px] leading-[1.08] tracking-tight text-ink-900 dark:text-sand-50',
  h1: 'font-display text-[28px] leading-[1.15] tracking-tight text-ink-900 dark:text-sand-50',
  h2: 'font-display text-[22px] leading-snug text-ink-900 dark:text-sand-50',
  h3: 'font-sans-semibold text-[17px] leading-snug text-ink-900 dark:text-sand-50',
  eyebrow:
    'font-sans-semibold text-[11px] uppercase tracking-[0.18em] text-ink-400 dark:text-ink-300',
  'body-lg': 'font-sans text-[17px] leading-[1.55] text-ink-800 dark:text-ink-100',
  body: 'font-sans text-[15px] leading-[1.55] text-ink-800 dark:text-ink-100',
  small: 'font-sans text-[13px] leading-[1.5] text-ink-700 dark:text-ink-200',
  caption: 'font-sans text-[11px] leading-[1.45] text-ink-500 dark:text-ink-300',
  mono: 'font-mono text-[13px] text-ink-700 dark:text-ink-100',
};

const toneClass: Record<Tone, string> = {
  default: '',
  muted: 'text-ink-500 dark:text-ink-300',
  subtle: 'text-ink-400 dark:text-ink-400',
  inverse: 'text-sand-50 dark:text-ink-900',
  accent: 'text-marigold-600 dark:text-marigold-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-terracotta-500',
};

export function Text({
  variant = 'body',
  tone,
  italic,
  muted,
  className,
  style,
  ...rest
}: TextProps) {
  const resolvedTone: Tone = tone ?? (muted ? 'muted' : 'default');
  const cls = `${variantClass[variant]} ${toneClass[resolvedTone]} ${className ?? ''}`;
  return (
    <RNText
      className={cls}
      style={italic ? [{ fontStyle: 'italic' }, style] : style}
      {...rest}
    />
  );
}
