import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { CommunityCard } from '@/features/community/CommunityCard';
import { supabase, type Community } from '@/lib/supabase';

const KINDS: { id: Community['kind'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'diaspora', label: 'Diaspora' },
  { id: 'professional', label: 'Professional' },
  { id: 'family', label: 'Family' },
  { id: 'interest', label: 'Interest' },
];

export default function CommunityTab() {
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['communities', kind],
    queryFn: async () => {
      const q = supabase.from('communities').select('*').order('member_count', { ascending: false });
      const { data } = kind === 'all' ? await q : await q.eq('kind', kind);
      return (data as Community[] | null) ?? [];
    },
  });

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="display">Community.</Text>
        <Text variant="body" muted className="mt-1">
          Verified diaspora groups. Vouched membership.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {KINDS.map((k) => (
            <Chip key={k.id} label={k.label} active={kind === k.id} onPress={() => setKind(k.id)} />
          ))}
        </View>

        <View className="mt-6 gap-3">
          {isLoading ? (
            <Text variant="small" muted>
              Loading…
            </Text>
          ) : (data ?? []).length === 0 ? (
            <EmptyState title="No groups yet" body="We'll seed your city's communities as the platform rolls out." />
          ) : (
            (data ?? []).map((c) => <CommunityCard key={c.id} community={c} />)
          )}
        </View>
      </View>
    </Screen>
  );
}
