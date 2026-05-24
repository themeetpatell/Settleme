import { useState } from 'react';
import { View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOnboarding } from '@/state/onboarding';
import { useIdentity } from '@/state/identity';
import { supabase } from '@/lib/supabase';
import { success, warn } from '@/lib/haptics';

export default function OnboardingVerify() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const reset = useOnboarding((s) => s.reset);
  const profile = useIdentity((s) => s.profile);
  const setIdentity = useIdentity((s) => s.setIdentity);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pickPassport() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setHasUploaded(true);
  }

  async function finish() {
    if (!profile) {
      warn();
      Alert.alert('Not signed in', 'Please sign in again.');
      return;
    }
    setBusy(true);
    const payload = {
      profile_id: profile.id,
      corridor: draft.corridor,
      origin_country: draft.origin_country,
      dest_country: draft.dest_country,
      dest_city: draft.dest_city,
      arrival_date: draft.arrival_date,
      visa_status: draft.visa_status,
      family_size: draft.family_size,
      dependents: draft.dependents,
    };
    const { data, error } = await supabase
      .from('identity_graph')
      .upsert(payload, { onConflict: 'profile_id' })
      .select('*')
      .single();
    setBusy(false);
    if (error) {
      warn();
      Alert.alert('Could not save', error.message);
      return;
    }
    setIdentity(data);
    reset();
    success();
    router.replace('/(tabs)');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-12">
        <Badge label="Optional — unlocks community + premium" tone="marigold" />
        <Text variant="h1" className="mt-4">
          Verify with your passport.
        </Text>
        <Text variant="body" muted className="mt-2">
          Verified members can post in communities, leave reviews on Trusted vendors, and access SettleMe Premium. Your photo never leaves our encrypted storage.
        </Text>

        <View className="mt-6 gap-3">
          <Card onPress={pickPassport}>
            <Text variant="h3">{hasUploaded ? 'Passport added ✓' : 'Upload passport photo'}</Text>
            <Text variant="small" muted>
              We need the photo page. Auto-cropped, never shared.
            </Text>
          </Card>
        </View>

        <View className="mt-8 gap-2">
          <Button title="Save & enter SettleMe" onPress={finish} loading={busy} fullWidth size="lg" />
          <Button title="Skip for now" onPress={finish} variant="ghost" />
        </View>
      </View>
    </Screen>
  );
}
