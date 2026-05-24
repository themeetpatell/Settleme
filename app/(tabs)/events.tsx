import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventCard } from '@/features/events/EventCard';
import { supabase, type EventRow } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';

type Filter = 'week' | 'month' | 'all';

export default function EventsTab() {
  const identity = useIdentity((s) => s.identity);
  const [filter, setFilter] = useState<Filter>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['events', identity?.dest_city, filter],
    queryFn: async () => {
      const now = new Date();
      const horizonDays = filter === 'week' ? 7 : filter === 'month' ? 30 : 365;
      const horizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('city', identity?.dest_city ?? 'Dubai')
        .gte('starts_at', now.toISOString())
        .lte('starts_at', horizon.toISOString())
        .order('starts_at', { ascending: true });
      return (data as EventRow[] | null) ?? [];
    },
  });

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="display">Events.</Text>
        <Text variant="body" muted className="mt-1">
          What's happening in your diaspora in {identity?.dest_city ?? 'your city'}.
        </Text>

        <View className="mt-4">
          <SegmentedTabs
            segments={[
              { value: 'week', label: 'This week' },
              { value: 'month', label: 'This month' },
              { value: 'all', label: 'All' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
          />
        </View>

        <View className="mt-6 gap-3">
          {isLoading ? (
            <Text variant="small" muted>
              Loading…
            </Text>
          ) : (data ?? []).length === 0 ? (
            <EmptyState title="Nothing this window" body="Try expanding the date range." />
          ) : (
            (data ?? []).map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>
      </View>
    </Screen>
  );
}
