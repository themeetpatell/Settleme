import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboarding } from '@/state/onboarding';

const STAGES = [
  { id: 'planning', label: 'Planning to move', blurb: 'A few months out', offset: 90, icon: 'airplane-outline' },
  { id: 'just_landed', label: 'Just landed', blurb: 'Past week or two', offset: -7, icon: 'flag-outline' },
  { id: 'first_year', label: 'In my first year', blurb: 'Still figuring things out', offset: -180, icon: 'compass-outline' },
  { id: 'settled', label: '2+ years in', blurb: 'I know the ropes', offset: -730, icon: 'home-outline' },
] as const;

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default function OnboardingArrival() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const set = useOnboarding((s) => s.set);
  const [stage, setStage] = useState<string | null>(null);
  const [exactDate, setExactDate] = useState(draft.arrival_date ?? '');

  const dateValid = !exactDate || ISO.test(exactDate);

  function next() {
    const arrival =
      exactDate && ISO.test(exactDate)
        ? exactDate
        : stage
          ? isoDate(STAGES.find((s) => s.id === stage)!.offset)
          : null;
    if (!arrival) return;
    set({ arrival_date: arrival });
    router.push('/(onboarding)/visa');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="h1">When are you in {draft.dest_city ?? 'your city'}?</Text>
        <Text variant="body" muted className="mt-2 max-w-md">
          We calibrate everything — visa renewals, tax deadlines, the right neighbourhoods — to
          where you are in the journey.
        </Text>

        <View className="mt-7 gap-2">
          {STAGES.map((s) => {
            const isSelected = stage === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setStage(s.id)}
                className={`flex-row items-center gap-4 rounded-2xl border-2 px-4 py-3 ${
                  isSelected
                    ? 'border-ink-900 bg-white dark:border-marigold-400 dark:bg-ink-800'
                    : 'border-ink-100 bg-white/60 dark:border-ink-700 dark:bg-ink-800/60'
                }`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-sand-100 dark:bg-ink-700">
                  <Ionicons name={s.icon} size={18} color="#0A0E17" />
                </View>
                <View className="flex-1">
                  <Text variant="h3">{s.label}</Text>
                  <Text variant="caption" muted>
                    {s.blurb}
                  </Text>
                </View>
                {isSelected ? (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-ink-900 dark:bg-marigold-400">
                    <Ionicons name="checkmark" size={12} color="#FBF8F2" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View className="mt-7">
          <Input
            label="Or pick an exact date"
            placeholder="YYYY-MM-DD"
            value={exactDate}
            onChangeText={setExactDate}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            error={exactDate && !dateValid ? 'Use format YYYY-MM-DD' : null}
            hint="Optional. Overrides the rough stage above."
            leading={<Ionicons name="calendar-outline" size={18} color="#5A6677" />}
          />
        </View>

        <View className="mt-8">
          <Button
            title="Continue"
            onPress={next}
            fullWidth
            size="lg"
            disabled={(!stage && !exactDate) || (!!exactDate && !dateValid)}
          />
        </View>
      </View>
    </Screen>
  );
}
