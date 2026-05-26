import { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <View className="flex-row items-center gap-3">
          <Avatar url={profile?.avatar_url ?? null} name={profile?.display_name ?? null} size={56} />
          <View className="flex-1">
            <Text variant="h2">{profile?.display_name ?? 'You'}</Text>
            <View className="mt-1 flex-row items-center gap-2">
              {profile?.verified_at ? <Badge label="Verified" tone="emerald" /> : <Badge label="Not verified" tone="terracotta" />}
              {identity?.corridor ? <Badge label={identity.corridor.replace('_', ' → ').toUpperCase()} /> : null}
            </View>
          </View>
        </View>

        <View className="mt-6 gap-3">
          <VisaTimeline identity={identity} />

          <Card onPress={() => router.push('/(messaging)/inbox')}>
            <Badge label="Messages" tone="ink" />
            <Text variant="h3" className="mt-2">
              Inbox
            </Text>
            <Text variant="small" muted className="mt-1">
              Your chats with SettleMe-trusted vendors.
            </Text>
          </Card>

          <Card onPress={() => setPaywall(true)}>
            <Badge label="Premium" tone="marigold" />
            <Text variant="h3" className="mt-2">
              SettleMe Premium
            </Text>
            <Text variant="small" muted className="mt-1">
              Agent does the paperwork. AED 49 / month. Free trial.
            </Text>
          </Card>

          <Card>
            <Text variant="h3">Family</Text>
            <Text variant="small" muted className="mt-1">
              {identity?.family_size ?? 1} in {identity?.dest_city ?? 'your city'}
            </Text>
          </Card>

          <Card>
            <Text variant="h3">Notifications</Text>
            <Text variant="small" muted className="mt-1">
              Visa renewal alerts, event invites, community replies. Coming soon.
            </Text>
          </Card>

          <View className="mt-2">
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
