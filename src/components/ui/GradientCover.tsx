import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';

type Palette = 'marigold' | 'emerald' | 'cobalt' | 'terracotta' | 'ink' | 'dusk' | 'sunset';

interface GradientCoverProps extends Omit<ViewProps, 'children'> {
  children?: ReactNode;
  palette?: Palette;
  height?: number;
  radius?: number;
  className?: string;
}

const palettes: Record<Palette, [string, string]> = {
  marigold: ['#FBD08D', '#D8861A'],
  emerald: ['#A8E0C5', '#16734F'],
  cobalt: ['#B6C5EC', '#1D459E'],
  terracotta: ['#F0C5BB', '#A84733'],
  ink: ['#39455A', '#0A0E17'],
  dusk: ['#E5A192', '#163784'],
  sunset: ['#FBD08D', '#C8553D'],
};

export function GradientCover({
  children,
  palette = 'marigold',
  height,
  radius = 0,
  className,
  style,
  ...rest
}: GradientCoverProps) {
  const colors = palettes[palette];
  return (
    <View
      className={`overflow-hidden ${className ?? ''}`}
      style={[{ height, borderRadius: radius }, style]}
      {...rest}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}
