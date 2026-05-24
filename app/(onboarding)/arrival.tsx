import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { useOnboarding } from '@/state/onboarding';

const STAGES = [
  { id: 'planning',     label: 'Planning to move',   offset: 90 },
  { id: 'just_landed',  label: 'Just landed',        offset: -7 },
  { id: 'first_year',   label: 'In my first year',   offset: -180 },
  { id: 'settled',      label: '2+ years in',        offset: -730 },
];

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export default function OnboardingArrival() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const [stage, setStage] = useState<string | null>(null);
  const [exactDate, setExactDate] = useState(draft.arrival_date ?? '');

  function next() {
    const arrival = exactDate || (stage ? isoDate(STAGES.find((s) => s.id === stage)!.offset) : null);
    if (!arrival) return;
    set({ arrival_date: arrival });
    router.push('/(onboarding)/visa');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-12">
        <Text variant="caption">Step 2 of 4</Text>
        <Text variant="h1" className="mt-2">
          When are you in {draft.dest_city ?? 'your city'}?
        </Text>

        <View className="mt-6 flex-row flex-wrap gap-2">
          {STAGES.map((s) => (
            <Chip key={s.id} label={s.label} active={stage === s.id} onPress={() => setStage(s.id)} />
          ))}
        </View>

        <View className="mt-6">
          <Input
            label="Or pick a date (optional)"
            placeholder="YYYY-MM-DD"
            value={exactDate}
            onChangeText={setExactDate}
            autoCapitalize="none"
            hint="We'll calibrate visa renewal, tax deadlines, and onboarding to this date."
          />
        </View>

        <View className="mt-8">
          <Button title="Continue" onPress={next} fullWidth size="lg" disabled={!stage && !exactDate} />
        </View>
      </View>
    </Screen>
  );
}
