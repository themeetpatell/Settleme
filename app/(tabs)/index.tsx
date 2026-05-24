import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase, type EventRow, type Community } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';

export default function Home() {
  const router = useRouter();
  const profile = useIdentity((s) => s.profile);
  const identity = useIdentity((s) => s.identity);

  const { data: upcoming } = useQuery({
    queryKey: ['home-events', identity?.dest_city],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('city', identity?.dest_city ?? 'Dubai')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3);
      return (data as EventRow[] | null) ?? [];
    },
  });

  const { data: communities } = useQuery({
    queryKey: ['home-communities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(3);
      return (data as Community[] | null) ?? [];
    },
  });

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="caption">Good day, {identity?.dest_city ?? 'home'}.</Text>
        <Text variant="display" className="mt-1">
          {profile?.display_name ?? 'Welcome'}.
        </Text>

        <Card className="mt-6" onPress={() => router.push('/(tabs)/ask')}>
          <Badge label="Ask SettleMe" tone="marigold" />
          <Text variant="h2" className="mt-3">
            What's on your mind?
          </Text>
          <Text variant="small" muted className="mt-1">
            Banking, visa, schools, neighbourhoods. We'll answer in your context.
          </Text>
        </Card>

        <View className="mt-8">
          <View className="mb-3 flex-row items-end justify-between">
            <Text variant="h2">This week</Text>
            <Button title="See all" variant="ghost" size="sm" onPress={() => router.push('/(tabs)/events')} />
          </View>
          <View className="gap-3">
            {(upcoming ?? []).map((e) => (
              <Card key={e.id}>
                <Text variant="caption">
                  {new Date(e.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                  {e.kind}
                </Text>
                <Text variant="h3" className="mt-1">
                  {e.title}
                </Text>
                <Text variant="small" muted className="mt-1">
                  {e.location ?? 'TBD'}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        <View className="mt-8">
          <View className="mb-3 flex-row items-end justify-between">
            <Text variant="h2">Your people</Text>
            <Button title="See all" variant="ghost" size="sm" onPress={() => router.push('/(tabs)/community')} />
          </View>
          <View className="gap-3">
            {(communities ?? []).map((c) => (
              <Card key={c.id}>
                <Text variant="h3">{c.name}</Text>
                <Text variant="small" muted className="mt-1">
                  {c.member_count.toLocaleString()} verified members · {c.kind}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
