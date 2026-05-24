import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
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
      <View className="px-6 pt-12">
        <Text variant="caption">Step 4 of 4</Text>
        <Text variant="h1" className="mt-2">
          Who's with you?
        </Text>
        <Text variant="body" muted className="mt-2">
          We'll surface schools, pediatricians, family events when relevant.
        </Text>

        <View className="mt-6 flex-row flex-wrap gap-2">
          {SIZES.map((n) => (
            <Chip key={n} label={n === 5 ? '5+' : String(n)} active={size === n} onPress={() => setSize(n)} />
          ))}
        </View>

        <Text variant="small" muted className="mt-4">
          People in your household at your destination.
        </Text>

        <View className="mt-8">
          <Button title="Continue" onPress={next} fullWidth size="lg" />
        </View>
      </View>
    </Screen>
  );
}
