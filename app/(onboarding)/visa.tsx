import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOnboarding } from '@/state/onboarding';

const VISA_TYPES = [
  { id: 'employment', label: 'Employment visa',   blurb: 'Sponsored by employer.' },
  { id: 'investor',   label: 'Investor / Founder', blurb: 'Golden visa, business setup.' },
  { id: 'dependent',  label: 'Dependent',          blurb: 'Sponsored by spouse / parent.' },
  { id: 'student',    label: 'Student',            blurb: 'On a study permit.' },
  { id: 'visit',      label: 'Visit / Tourist',    blurb: 'Short stay, exploring.' },
  { id: 'other',      label: 'Other / planning',   blurb: "I'll figure it out." },
];

export default function OnboardingVisa() {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const visa = useOnboarding((s) => s.draft.visa_status);
  const [selected, setSelected] = useState<string | null>(visa);

  function next() {
    set({ visa_status: selected });
    router.push('/(onboarding)/family');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-12">
        <Text variant="caption">Step 3 of 4</Text>
        <Text variant="h1" className="mt-2">
          What's your visa?
        </Text>
        <Text variant="body" muted className="mt-2">
          Helps us track renewals, rights, and the right path for you.
        </Text>

        <View className="mt-6 gap-3">
          {VISA_TYPES.map((v) => (
            <Card key={v.id} onPress={() => setSelected(v.id)} className={selected === v.id ? 'border-ink-900' : ''}>
              <Text variant="h3">{v.label}</Text>
              <Text variant="small" muted>
                {v.blurb}
              </Text>
            </Card>
          ))}
        </View>

        <View className="mt-8">
          <Button title="Continue" onPress={next} fullWidth size="lg" disabled={!selected} />
        </View>
      </View>
    </Screen>
  );
}
