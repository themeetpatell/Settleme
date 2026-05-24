import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { VendorCard } from '@/features/trusted/VendorCard';
import { supabase, type Vendor } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';

const CATEGORIES = [
  { id: 'all',        label: 'All' },
  { id: 'pro',        label: 'PROs' },
  { id: 'lawyer',     label: 'Lawyers' },
  { id: 'accountant', label: 'Accountants' },
  { id: 'property',   label: 'Property' },
  { id: 'school',     label: 'Schools' },
  { id: 'dentist',    label: 'Doctors' },
  { id: 'movers',     label: 'Movers' },
];

export default function TrustedTab() {
  const identity = useIdentity((s) => s.identity);
  const [cat, setCat] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', identity?.dest_city, cat],
    queryFn: async () => {
      const q = supabase
        .from('vendors')
        .select('*')
        .eq('city', identity?.dest_city ?? 'Dubai')
        .order('rating', { ascending: false });
      const { data } = cat === 'all' ? await q : await q.eq('category', cat);
      return (data as Vendor[] | null) ?? [];
    },
  });

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="display">Trusted.</Text>
        <Text variant="body" muted className="mt-1">
          Vetted services for diaspora in {identity?.dest_city ?? 'your city'}. Rated by your community.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} active={cat === c.id} onPress={() => setCat(c.id)} />
          ))}
        </View>

        <View className="mt-6 gap-3">
          {isLoading ? (
            <Text variant="small" muted>
              Loading…
            </Text>
          ) : (data ?? []).length === 0 ? (
            <EmptyState title="No vendors yet in this category" body="We add new ones every week." />
          ) : (
            (data ?? []).map((v) => <VendorCard key={v.id} vendor={v} />)
          )}
        </View>
      </View>
    </Screen>
  );
}
