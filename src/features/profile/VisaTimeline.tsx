import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import type { IdentityGraph } from '@/lib/supabase';

interface VisaTimelineProps {
  identity: IdentityGraph | null;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function VisaTimeline({ identity }: VisaTimelineProps) {
  if (!identity) {
    return (
      <Card>
        <Text variant="h3">No visa timeline yet</Text>
        <Text variant="small" muted className="mt-1">
          Complete your identity setup to see renewal alerts.
        </Text>
      </Card>
    );
  }
  const renewIn = daysUntil(identity.visa_expires_on);
  return (
    <Card>
      <Text variant="caption">Your visa</Text>
      <Text variant="h3" className="mt-1">
        {identity.visa_status ?? '—'}
      </Text>
      <View className="mt-3 flex-row items-center gap-2">
        {identity.arrival_date ? <Badge label={`Arrived ${identity.arrival_date}`} tone="default" /> : null}
        {renewIn !== null ? (
          <Badge
            label={renewIn > 0 ? `Renews in ${renewIn} days` : 'Renew now'}
            tone={renewIn > 60 ? 'emerald' : 'terracotta'}
          />
        ) : null}
      </View>
    </Card>
  );
}
