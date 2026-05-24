import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import type { Vendor } from '@/lib/supabase';

interface VendorCardProps {
  vendor: Vendor;
  onPress?: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  pro: 'PRO',
  lawyer: 'Lawyer',
  accountant: 'Accountant',
  property: 'Property',
  school: 'School',
  dentist: 'Doctor',
  movers: 'Movers',
};

export function VendorCard({ vendor, onPress }: VendorCardProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <Badge label={CATEGORY_LABEL[vendor.category] ?? vendor.category} tone="default" />
        {vendor.verified_at ? <Badge label="Verified" tone="emerald" /> : null}
      </View>
      <Text variant="h3" className="mt-2">
        {vendor.name}
      </Text>
      {vendor.description ? (
        <Text variant="small" muted className="mt-1">
          {vendor.description}
        </Text>
      ) : null}
      <View className="mt-3 flex-row items-center gap-3">
        <Text variant="small" className="font-semibold">
          ★ {vendor.rating.toFixed(1)}
        </Text>
        <Text variant="caption">{vendor.review_count} reviews</Text>
      </View>
    </Card>
  );
}
