import { Platform, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';

interface GlassProps extends ViewProps {
  children: ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  className?: string;
}

export function Glass({
  children,
  intensity = 60,
  tint = 'light',
  className,
  style,
  ...rest
}: GlassProps) {
  if (Platform.OS === 'web') {
    return (
      <View
        className={`bg-white/60 dark:bg-ink-900/60 ${className ?? ''}`}
        style={[{ backdropFilter: 'blur(20px)' } as never, style]}
        {...rest}
      >
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={intensity} tint={tint} className={className ?? ''} style={style}>
      {children}
    </BlurView>
  );
}
