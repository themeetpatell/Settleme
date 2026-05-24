import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOnboarding } from '@/state/onboarding';

const CORRIDORS = [
  { id: 'in_ae', label: 'India → UAE', origin: 'India', dest: 'UAE', city: 'Dubai' },
  { id: 'in_uk', label: 'India → UK', origin: 'India', dest: 'UK', city: 'London' },
  { id: 'in_ca', label: 'India → Canada', origin: 'India', dest: 'Canada', city: 'Toronto' },
  { id: 'in_sg', label: 'India → Singapore', origin: 'India', dest: 'Singapore', city: 'Singapore' },
  { id: 'ph_ae', label: 'Philippines → UAE', origin: 'Philippines', dest: 'UAE', city: 'Dubai' },
];

export default function OnboardingCorridor() {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const corridor = useOnboarding((s) => s.draft.corridor);
  const [selected, setSelected] = useState(corridor ?? 'in_ae');

  function next() {
    const c = CORRIDORS.find((x) => x.id === selected)!;
    set({ corridor: c.id, origin_country: c.origin, dest_country: c.dest, dest_city: c.city });
    router.push('/(onboarding)/arrival');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-12">
        <Text variant="caption">Step 1 of 4</Text>
        <Text variant="h1" className="mt-2">
          Which corridor?
        </Text>
        <Text variant="body" muted className="mt-2">
          Pick yours. We'll tune every answer and surface to your country and city.
        </Text>

        <View className="mt-6 gap-3">
          {CORRIDORS.map((c) => (
            <Card key={c.id} onPress={() => setSelected(c.id)} className={selected === c.id ? 'border-ink-900' : ''}>
              <Text variant="h3">{c.label}</Text>
              <Text variant="small" muted>
                Beachhead city: {c.city}
              </Text>
            </Card>
          ))}
        </View>

        <View className="mt-8">
          <Button title="Continue" onPress={next} fullWidth size="lg" />
        </View>
      </View>
    </Screen>
  );
}
