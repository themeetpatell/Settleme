import { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { VisaTimeline } from '@/features/profile/VisaTimeline';
import { PaywallSheet } from '@/features/premium/PaywallSheet';
import { useIdentity } from '@/state/identity';
import { supabase } from '@/lib/supabase';
import { profileHeroImage } from '@/lib/aiImage';

export default function ProfileTab() {
  const router = useRouter();
  const profile = useIdentity((s) => s.profile);
  const identity = useIdentity((s) => s.identity);
  const reset = useIdentity((s) => s.reset);
  const [paywall, setPaywall] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    reset();
  }

  const heroUrl = profileHeroImage(profile?.id ?? 'guest');
  const corridorLabel = identity?.corridor
    ? `${identity.origin_country ?? '?'} → ${identity.dest_country ?? '?'}`
    : null;

  return (
    <Screen scroll>
      <View className="relative">
        <View className="h-44 w-full overflow-hidden bg-sand-200">
          <Image
            source={{ uri: heroUrl }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['rgba(10,14,23,0.0)', 'rgba(251,248,242,1)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
        <View className="-mt-12 px-6">
          <View className="flex-row items-end gap-4">
            <View className="rounded-full border-4 border-canvas dark:border-ink-900">
              <Avatar
                url={profile?.avatar_url ?? null}
                name={profile?.display_name ?? null}
                size={88}
              />
            </View>
            <View className="flex-1 pb-1">
              <Text variant="display">{profile?.display_name ?? 'You'}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                {profile?.verified_at ? (
                  <Badge label="Verified" tone="emerald" dot />
                ) : (
                  <Badge label="Unverified" tone="terracotta" dot />
                )}
                {corridorLabel ? <Badge label={corridorLabel} tone="default" /> : null}
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-6 px-6">
        <View className="flex-row gap-3">
          <Card variant="ghost" elevation={0} className="flex-1 p-4">
            <Text variant="eyebrow">CORRIDOR</Text>
            <Text variant="h3" className="mt-1">
              {identity?.dest_city ?? '—'}
            </Text>
            <Text variant="caption" muted className="mt-0.5">
              {identity?.origin_country ?? 'Origin not set'}
            </Text>
          </Card>
          <Card variant="ghost" elevation={0} className="flex-1 p-4">
            <Text variant="eyebrow">VISA</Text>
            <Text variant="h3" className="mt-1">
              {identity?.visa_status ?? '—'}
            </Text>
            <Text variant="caption" muted className="mt-0.5">
              {identity?.visa_expires_on ? `Until ${identity.visa_expires_on}` : 'Not tracked'}
            </Text>
          </Card>
          <Card variant="ghost" elevation={0} className="flex-1 p-4">
            <Text variant="eyebrow">FAMILY</Text>
            <Text variant="h3" className="mt-1">
              {identity?.family_size ?? 1}
            </Text>
            <Text variant="caption" muted className="mt-0.5">
              In {identity?.dest_city ?? 'destination'}
            </Text>
          </Card>
        </View>

        <View className="mt-5 gap-3">
          <VisaTimeline identity={identity} />

          <Card onPress={() => router.push('/(messaging)/inbox')}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-cobalt-100">
                <Ionicons name="mail-outline" size={18} color="#163784" />
              </View>
              <View className="flex-1">
                <Text variant="h3">Inbox</Text>
                <Text variant="small" muted className="mt-0.5">
                  Your chats with SettleMe-trusted vendors
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5A6677" />
            </View>
          </Card>

          <Card variant="tinted" tone="marigold" onPress={() => setPaywall(true)}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-marigold-500">
                <Ionicons name="sparkles" size={18} color="#0A0E17" />
              </View>
              <View className="flex-1">
                <Text variant="h3">SettleMe Premium</Text>
                <Text variant="small" muted className="mt-0.5">
                  Agent does the paperwork · AED 49 / month
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5A6677" />
            </View>
          </Card>

          <Card>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 dark:bg-ink-700">
                <Ionicons name="notifications-outline" size={18} color="#0A0E17" />
              </View>
              <View className="flex-1">
                <Text variant="h3">Notifications</Text>
                <Text variant="small" muted className="mt-0.5">
                  Visa renewals, event invites, community replies
                </Text>
              </View>
            </View>
          </Card>

          <View className="mt-4">
            <Button
              title="Sign out"
              variant="ghost"
              onPress={() =>
                Alert.alert('Sign out?', '', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: signOut },
                ])
              }
            />
          </View>
        </View>
      </View>

      <PaywallSheet
        visible={paywall}
        onClose={() => setPaywall(false)}
        onSubscribe={() => {
          setPaywall(false);
          Alert.alert('Premium', 'Billing wiring is next (Stripe + IAP).');
        }}
      />
    </Screen>
  );
}
