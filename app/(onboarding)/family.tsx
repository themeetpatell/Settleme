import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/state/onboarding';

const SIZES = [1, 2, 3, 4, 5];

export default function OnboardingFamily() {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const [size, setSize] = useState(useOnboarding.getState().draft.family_size);

  function next() {
    set({ family_size: size });
    router.push('/(onboarding)/verify');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="h1">Who's with you?</Text>
        <Text variant="body" muted className="mt-2 max-w-md">
          We'll surface schools, pediatricians, family-friendly neighbourhoods and events when
          they're relevant to you.
        </Text>

        <View className="mt-7">
          <Text variant="eyebrow" className="mb-3">
            PEOPLE IN YOUR HOUSEHOLD
          </Text>
          <View className="flex-row gap-2">
            {SIZES.map((n) => {
              const isSelected = size === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setSize(n)}
                  className={`h-16 flex-1 items-center justify-center rounded-2xl border-2 ${
                    isSelected
                      ? 'border-ink-900 bg-ink-900 dark:border-marigold-400 dark:bg-marigold-400'
                      : 'border-ink-100 bg-white/60 dark:border-ink-700 dark:bg-ink-800/60'
                  }`}
                >
                  <Text
                    variant="h2"
                    className={isSelected ? 'text-sand-50 dark:text-ink-900' : ''}
                  >
                    {n === 5 ? '5+' : String(n)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-7 flex-row gap-3 rounded-2xl bg-marigold-100 p-4 dark:bg-marigold-900/30">
          <Ionicons name="information-circle-outline" size={20} color="#9A5814" />
          <Text variant="small" className="flex-1 text-marigold-700 dark:text-marigold-300">
            You can add dependents (names + ages) anytime in Profile. We use it to anchor school
            and pediatrician recommendations.
          </Text>
        </View>

        <View className="mt-8">
          <Button title="Continue" onPress={next} fullWidth size="lg" />
        </View>
      </View>
    </Screen>
  );
}
