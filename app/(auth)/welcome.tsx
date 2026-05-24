import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen scroll>
      <View className="flex-1 justify-between px-6 pt-12 pb-8">
        <View>
          <Badge label="Indians in UAE · beta" tone="marigold" />
          <Text variant="display" className="mt-6">
            SettleMe.
          </Text>
          <Text variant="h2" muted className="mt-2">
            Your diaspora life, all in one place.
          </Text>
          <Text variant="body" muted className="mt-6">
            The verified diaspora life OS. Ask anything about life abroad. Find your community. Vetted services. Events that matter. Built for the first 2 years and the next 20.
          </Text>
        </View>

        <View className="gap-3">
          <Button title="Get started" onPress={() => router.push('/(auth)/login')} variant="primary" fullWidth size="lg" />
          <Button title="I already have an account" onPress={() => router.push('/(auth)/login')} variant="ghost" fullWidth />
        </View>
      </View>
    </Screen>
  );
}
