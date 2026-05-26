import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  tone?: 'sand' | 'white' | 'ink';
}

const toneClass: Record<NonNullable<ScreenProps['tone']>, string> = {
  sand: 'bg-canvas dark:bg-ink-900',
  white: 'bg-white dark:bg-ink-900',
  ink: 'bg-ink-900',
};

export function Screen({
  children,
  scroll,
  edges = ['top'],
  tone = 'sand',
  className,
  ...rest
}: ScreenProps) {
  const bg = toneClass[tone];
  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={edges}>
      {scroll ? (
        <ScrollView
          className={`flex-1 ${className ?? ''}`}
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${className ?? ''}`} {...rest}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
