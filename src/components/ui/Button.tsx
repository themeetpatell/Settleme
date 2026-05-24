import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from './Text';
import { tap } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-ink-900 active:bg-ink-700',
  secondary: 'bg-ink-50 border border-ink-100 active:bg-ink-100 dark:bg-ink-800 dark:border-ink-700',
  ghost: 'bg-transparent active:bg-ink-100/60 dark:active:bg-ink-700/60',
  destructive: 'bg-terracotta-500 active:bg-terracotta-500/90',
};

const labelClass: Record<Variant, string> = {
  primary: 'text-canvas',
  secondary: 'text-ink-900 dark:text-ink-50',
  ghost: 'text-ink-700 dark:text-ink-100',
  destructive: 'text-canvas',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth,
  leading,
  trailing,
  loading,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      onPress={(e) => {
        tap();
        onPress?.(e);
      }}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center rounded-2xl ${variantClass[variant]} ${sizeClass[size]} ${
        fullWidth ? 'w-full' : ''
      } ${disabled || loading ? 'opacity-50' : ''}`}
      {...rest}
    >
      {leading ? <View className="mr-2">{leading}</View> : null}
      <Text variant="body" className={`font-semibold ${labelClass[variant]}`}>
        {loading ? 'Working…' : title}
      </Text>
      {trailing ? <View className="ml-2">{trailing}</View> : null}
    </Pressable>
  );
}
