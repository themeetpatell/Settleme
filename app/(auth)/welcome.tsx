import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PROOF = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified diaspora',
    body: 'Passport-checked members. No bots, no spam, no agents pretending to help.',
  },
  {
    icon: 'sparkles-outline',
    title: 'An agent that acts',
    body: 'Books a PRO. Sets visa renewals. Drafts your first message. Not just chat.',
  },
  {
    icon: 'people-outline',
    title: 'Your city, your people',
    body: 'Indians in Dubai today. Filipinos in Riyadh next. Built corridor by corridor.',
  },
] as const;

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen scroll>
      <View className="px-6 pt-10 pb-10">
        <Badge label="Indians in UAE · beta" tone="marigold" dot />

        <View className="mt-8">
          <Text variant="display-lg">
            Your diaspora{'\n'}life,{' '}
            <Text variant="display-lg" italic tone="accent">
              orchestrated.
            </Text>
          </Text>
          <Text variant="body-lg" muted className="mt-5 max-w-md">
            The verified life OS for people who moved. Ask anything, find your community, get
            things done — not just answered.
          </Text>
        </View>

        <View className="mt-8 rounded-3xl bg-ink-900 p-6 dark:border dark:border-ink-700">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-marigold-400" />
            <Text variant="caption" tone="inverse" className="opacity-80">
              Live now in Dubai
            </Text>
          </View>
          <Text variant="h1" tone="inverse" className="mt-3">
            "Find me a PRO for Emirates ID and start the chat."
          </Text>
          <Text variant="small" tone="inverse" className="mt-3 opacity-70">
            SettleMe → searched 7 trusted vendors → opened a chat with Sahil → reminder set for
            your visa renewal. All in 6 seconds.
          </Text>
        </View>

        <View className="mt-10 gap-4">
          {PROOF.map((p) => (
            <View key={p.title} className="flex-row gap-4">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-marigold-100">
                <Ionicons name={p.icon as never} size={18} color="#9A5814" />
              </View>
              <View className="flex-1">
                <Text variant="h3">{p.title}</Text>
                <Text variant="small" muted className="mt-1">
                  {p.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-10 gap-2">
          <Button
            title="Start free"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            fullWidth
            size="lg"
          />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            fullWidth
          />
          <Text variant="caption" className="mt-3 text-center">
            By continuing you agree to our terms. Verification is optional but unlocks community.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
