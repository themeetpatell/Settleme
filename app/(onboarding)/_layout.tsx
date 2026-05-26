import { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';

const STEP_ORDER: { name: string; label: string }[] = [
  { name: 'corridor', label: 'Corridor' },
  { name: 'arrival', label: 'Arrival' },
  { name: 'visa', label: 'Visa' },
  { name: 'family', label: 'Family' },
  { name: 'verify', label: 'Verification' },
];

export default function OnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  const current = segments[segments.length - 1];

  const stepIndex = useMemo(() => {
    const idx = STEP_ORDER.findIndex((s) => s.name === current);
    return idx === -1 ? 0 : idx;
  }, [current]);

  const stepNum = stepIndex + 1;
  const total = STEP_ORDER.length;
  const label = STEP_ORDER[stepIndex]?.label ?? '';

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-ink-900" edges={['top']}>
      <View className="px-6 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(auth)/welcome')
            }
            accessibilityLabel="Back"
            className="h-9 w-9 items-center justify-center rounded-full active:bg-ink-100 dark:active:bg-ink-700"
          >
            <Ionicons name="chevron-back" size={20} color="#0A0E17" />
          </Pressable>
          <Text variant="caption">
            STEP {stepNum} OF {total} · {label.toUpperCase()}
          </Text>
          <View className="h-9 w-9" />
        </View>
        <ProgressBar value={stepNum} total={total} className="mt-3" />
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </SafeAreaView>
  );
}
