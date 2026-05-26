import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase, type Vendor } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';
import { tap, success, warn } from '@/lib/haptics';

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
  const router = useRouter();
  const profile = useIdentity((s) => s.profile);

  async function startMessage() {
    if (!profile?.id) {
      warn();
      return;
    }
    tap();
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('member_id', profile.id)
        .eq('vendor_id', vendor.id)
        .maybeSingle();

      let convId = existing?.id as string | undefined;
      if (!convId) {
        const { data: created, error } = await supabase
          .from('conversations')
          .insert({ member_id: profile.id, vendor_id: vendor.id, source: 'manual' })
          .select('id')
          .single();
        if (error || !created) {
          warn();
          return;
        }
        convId = created.id as string;
      }

      const label = CATEGORY_LABEL[vendor.category] ?? vendor.category;
      const draft = `Hi ${vendor.name.split(' ')[0]}, I'd like help with ${label}. Sent via SettleMe.`;
      await supabase.from('conversation_messages').insert({
        conversation_id: convId,
        sender_kind: 'member',
        sender_profile_id: profile.id,
        body: draft,
      });

      await supabase.from('events_log').insert({
        profile_id: profile.id,
        event_name: 'vendor_message_sent',
        props: { vendor_id: vendor.id, source: 'card' },
      });

      success();
      router.push(`/(messaging)/${convId}`);
    } catch {
      warn();
    }
  }

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

      <View className="mt-3">
        <Button title="Message" size="sm" onPress={startMessage} disabled={!profile?.id} />
      </View>
    </Card>
  );
}
