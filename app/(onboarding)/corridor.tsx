import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/state/onboarding';

interface Corridor {
  id: string;
  origin: string;
  dest: string;
  city: string;
  flagOrigin: string;
  flagDest: string;
  available: boolean;
}

const CORRIDORS: Corridor[] = [
  { id: 'in_ae', origin: 'India', dest: 'UAE', city: 'Dubai', flagOrigin: '🇮🇳', flagDest: '🇦🇪', available: true },
  { id: 'in_uk', origin: 'India', dest: 'UK', city: 'London', flagOrigin: '🇮🇳', flagDest: '🇬🇧', available: false },
  { id: 'in_ca', origin: 'India', dest: 'Canada', city: 'Toronto', flagOrigin: '🇮🇳', flagDest: '🇨🇦', available: false },
  { id: 'in_sg', origin: 'India', dest: 'Singapore', city: 'Singapore', flagOrigin: '🇮🇳', flagDest: '🇸🇬', available: false },
  { id: 'ph_ae', origin: 'Philippines', dest: 'UAE', city: 'Dubai', flagOrigin: '🇵🇭', flagDest: '🇦🇪', available: false },
];

export default function OnboardingCorridor() {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const corridor = useOnboarding((s) => s.draft.corridor);
  const [selected, setSelected] = useState(corridor ?? 'in_ae');

  function next() {
    const c = CORRIDORS.find((x) => x.id === selected)!;
    set({
      corridor: c.id,
      origin_country: c.origin,
      dest_country: c.dest,
      dest_city: c.city,
    });
    router.push('/(onboarding)/arrival');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="h1">Which corridor is yours?</Text>
        <Text variant="body" muted className="mt-2 max-w-md">
          We tune every answer to your country and city. Pick yours — others coming soon.
        </Text>

        <View className="mt-7 gap-3">
          {CORRIDORS.map((c) => {
            const isSelected = selected === c.id;
            const isAvailable = c.available;
            return (
              <Pressable
                key={c.id}
                disabled={!isAvailable}
                onPress={() => setSelected(c.id)}
                className={`flex-row items-center gap-4 rounded-3xl border-2 px-5 py-4 ${
                  isSelected
                    ? 'border-ink-900 bg-white dark:border-marigold-400 dark:bg-ink-800'
                    : 'border-ink-100 bg-white/60 dark:border-ink-700 dark:bg-ink-800/60'
                } ${!isAvailable ? 'opacity-60' : ''}`}
              >
                <View className="flex-row items-center">
                  <Text variant="display" className="leading-none">
                    {c.flagOrigin}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#5A6677"
                    style={{ marginHorizontal: 6 }}
                  />
                  <Text variant="display" className="leading-none">
                    {c.flagDest}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text variant="h3">
                    {c.origin} → {c.dest}
                  </Text>
                  <Text variant="small" muted className="mt-0.5">
                    Beachhead city: {c.city}
                    {!isAvailable ? ' · coming soon' : ''}
                  </Text>
                </View>
                {isSelected && isAvailable ? (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-ink-900 dark:bg-marigold-400">
                    <Ionicons name="checkmark" size={14} color="#FBF8F2" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View className="mt-8">
          <Button title="Continue" onPress={next} fullWidth size="lg" />
        </View>
      </View>
    </Screen>
  );
}
