import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GradientCover } from '@/components/ui/GradientCover';
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

const CATEGORY_EMOJI: Record<string, string> = {
  pro: '📋',
  lawyer: '⚖️',
  accountant: '🧮',
  property: '🏛️',
  school: '🎓',
  dentist: '🩺',
  movers: '📦',
};

const CATEGORY_PALETTE: Record<
  string,
  'marigold' | 'emerald' | 'cobalt' | 'terracotta' | 'sunset' | 'dusk' | 'ink'
> = {
  pro: 'marigold',
  lawyer: 'cobalt',
  accountant: 'emerald',
  property: 'sunset',
  school: 'cobalt',
  dentist: 'terracotta',
  movers: 'dusk',
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

  const palette = CATEGORY_PALETTE[vendor.category] ?? 'marigold';
  const emoji = CATEGORY_EMOJI[vendor.category] ?? '✨';

  return (
    <Card onPress={onPress} elevation={2} className="overflow-hidden p-0">
      <GradientCover palette={palette} height={64}>
        <View className="flex-1 flex-row items-end justify-between p-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/95">
            <Text variant="h2" className="leading-none">
              {emoji}
            </Text>
          </View>
          {vendor.verified_at ? <Badge label="Verified" tone="emerald" /> : null}
        </View>
      </GradientCover>

      <View className="p-5 pt-3">
        <Badge label={CATEGORY_LABEL[vendor.category] ?? vendor.category} tone="default" />
        <Text variant="h3" className="mt-2">
          {vendor.name}
        </Text>
        {vendor.description ? (
          <Text variant="small" muted className="mt-1">
            {vendor.description}
          </Text>
        ) : null}
        <View className="mt-3 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={14} color="#F4A227" />
            <Text variant="small" className="font-sans-semibold">
              {vendor.rating.toFixed(1)}
            </Text>
          </View>
          <Text variant="caption">{vendor.review_count} reviews</Text>
        </View>

        <View className="mt-4">
          <Button
            title="Message"
            size="sm"
            onPress={startMessage}
            disabled={!profile?.id}
            leading={<Ionicons name="chatbubble-outline" size={14} color="#FBF8F2" />}
          />
        </View>
      </View>
    </Card>
  );
}
