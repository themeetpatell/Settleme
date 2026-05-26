import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  View,
  type PressableProps,
} from 'react-native';
import { Text } from './Text';
import { tap } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent';
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
  primary: 'bg-ink-900 active:bg-ink-800 dark:bg-sand-50 dark:active:bg-sand-100',
  accent:
    'bg-marigold-500 active:bg-marigold-600 dark:bg-marigold-400 dark:active:bg-marigold-300',
  secondary:
    'bg-white border border-ink-100 active:bg-sand-100 dark:bg-ink-800 dark:border-ink-700',
  ghost: 'bg-transparent active:bg-ink-100/50 dark:active:bg-ink-700/60',
  destructive: 'bg-terracotta-500 active:bg-terracotta-600',
};

const labelClass: Record<Variant, string> = {
  primary: 'text-sand-50 dark:text-ink-900',
  accent: 'text-ink-900',
  secondary: 'text-ink-900 dark:text-sand-50',
  ghost: 'text-ink-700 dark:text-ink-100',
  destructive: 'text-sand-50',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3.5 rounded-xl',
  md: 'h-11 px-4 rounded-2xl',
  lg: 'h-14 px-5 rounded-2xl',
};

const spinnerColor: Record<Variant, string> = {
  primary: '#FBF8F2',
  accent: '#0A0E17',
  secondary: '#0A0E17',
  ghost: '#5A6677',
  destructive: '#FBF8F2',
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
  const scale = useRef(new Animated.Value(1)).current;
  const isInactive = disabled || loading;

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, fullWidth ? { width: '100%' } : null]}
    >
      <Pressable
        onPress={(e) => {
          tap();
          onPress?.(e);
        }}
        onPressIn={() =>
          !isInactive &&
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 60,
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
        disabled={isInactive}
        className={`flex-row items-center justify-center ${variantClass[variant]} ${sizeClass[size]} ${
          isInactive ? 'opacity-50' : ''
        }`}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor[variant]} size="small" />
        ) : (
          <>
            {leading ? <View className="mr-2">{leading}</View> : null}
            <Text
              variant={size === 'lg' ? 'body-lg' : 'body'}
              className={`font-sans-semibold ${labelClass[variant]}`}
            >
              {title}
            </Text>
            {trailing ? <View className="ml-2">{trailing}</View> : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
