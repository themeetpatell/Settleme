import { useRef } from 'react';
import { Animated, Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tap } from '@/lib/haptics';

type Tone = 'ink' | 'sand' | 'marigold' | 'emerald' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  iconName: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  size?: Size;
  label?: string;
}

const toneBg: Record<Tone, string> = {
  ink: 'bg-ink-900 dark:bg-sand-50',
  sand: 'bg-sand-100 dark:bg-ink-700',
  marigold: 'bg-marigold-500',
  emerald: 'bg-emerald-500',
  ghost: 'bg-transparent border border-ink-100 dark:border-ink-700',
};

const toneFg: Record<Tone, string> = {
  ink: '#FBF8F2',
  sand: '#0A0E17',
  marigold: '#0A0E17',
  emerald: '#FBF8F2',
  ghost: '#0A0E17',
};

const sizeBox: Record<Size, { box: string; px: number }> = {
  sm: { box: 'h-9 w-9 rounded-xl', px: 16 },
  md: { box: 'h-11 w-11 rounded-2xl', px: 20 },
  lg: { box: 'h-14 w-14 rounded-2xl', px: 24 },
};

export function IconButton({
  iconName,
  tone = 'sand',
  size = 'md',
  label,
  onPress,
  ...rest
}: IconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = sizeBox[size];
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityLabel={label}
        onPress={(e) => {
          tap();
          onPress?.(e);
        }}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.92,
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
        className={`items-center justify-center ${toneBg[tone]} ${cfg.box}`}
        {...rest}
      >
        <Ionicons name={iconName} size={cfg.px} color={toneFg[tone]} />
      </Pressable>
    </Animated.View>
  );
}
