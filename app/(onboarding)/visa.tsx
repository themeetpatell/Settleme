import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboarding } from '@/state/onboarding';

const VISA_TYPES = [
  { id: 'employment', label: 'Employment', icon: 'briefcase-outline', blurb: 'Sponsored by your employer.' },
  { id: 'investor', label: 'Investor / Founder', icon: 'rocket-outline', blurb: 'Golden visa, business setup.' },
  { id: 'dependent', label: 'Dependent', icon: 'people-outline', blurb: 'Sponsored by spouse or parent.' },
  { id: 'student', label: 'Student', icon: 'school-outline', blurb: 'On a study permit.' },
  { id: 'visit', label: 'Visit / Tourist', icon: 'airplane-outline', blurb: 'Short stay, exploring.' },
  { id: 'other', label: 'Other / planning', icon: 'help-circle-outline', blurb: "I'll figure it out." },
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function OnboardingVisa() {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const visa = useOnboarding((s) => s.draft.visa_status);
  const visaExpires = useOnboarding((s) => s.draft.visa_expires_on);
  const [selected, setSelected] = useState<string | null>(visa);
  const [expiry, setExpiry] = useState(visaExpires ?? '');

  const expiryValid = !expiry || ISO_DATE.test(expiry);

  function next() {
    set({
      visa_status: selected,
      visa_expires_on: expiry && ISO_DATE.test(expiry) ? expiry : null,
    });
    router.push('/(onboarding)/family');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="h1">What's your visa?</Text>
        <Text variant="body" muted className="mt-2 max-w-md">
          We'll track renewals and surface the right professionals when it matters.
        </Text>

        <View className="mt-7 gap-2">
          {VISA_TYPES.map((v) => {
            const isSelected = selected === v.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => setSelected(v.id)}
                className={`flex-row items-center gap-4 rounded-2xl border-2 px-4 py-3 ${
                  isSelected
                    ? 'border-ink-900 bg-white dark:border-marigold-400 dark:bg-ink-800'
                    : 'border-ink-100 bg-white/60 dark:border-ink-700 dark:bg-ink-800/60'
                }`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-sand-100 dark:bg-ink-700">
                  <Ionicons name={v.icon} size={18} color="#0A0E17" />
                </View>
                <View className="flex-1">
                  <Text variant="h3">{v.label}</Text>
                  <Text variant="caption" muted>
                    {v.blurb}
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
            label="Visa expiry (optional)"
            placeholder="YYYY-MM-DD"
            value={expiry}
            onChangeText={setExpiry}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            error={expiry && !expiryValid ? 'Use format YYYY-MM-DD' : null}
            hint="We'll ping you 90 / 60 / 30 days before renewal."
            leading={<Ionicons name="calendar-outline" size={18} color="#5A6677" />}
          />
        </View>

        <View className="mt-8">
          <Button
            title="Continue"
            onPress={next}
            fullWidth
            size="lg"
            disabled={!selected || (!!expiry && !expiryValid)}
          />
        </View>
      </View>
    </Screen>
  );
}
