import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({ children, scroll, edges = ['top'], className, ...rest }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark" edges={edges}>
      {scroll ? (
        <ScrollView
          className={`flex-1 ${className ?? ''}`}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
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
