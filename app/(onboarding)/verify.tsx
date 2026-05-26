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
import { registerForPushAsync } from '@/lib/pushNotifications';
import { success, warn } from '@/lib/haptics';

export default function OnboardingVerify() {
  const router = useRouter();
  const draft = useOnboarding((s) => s.draft);
  const reset = useOnboarding((s) => s.reset);
  const profile = useIdentity((s) => s.profile);
  const setIdentity = useIdentity((s) => s.setIdentity);
  const [picked, setPicked] = useState<ImagePicker.ImagePickerAsset | null>(null);
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
    if (!result.canceled && result.assets[0]) {
      setPicked(result.assets[0]);
    }
  }

  async function uploadPassport(profileId: string): Promise<string | null> {
    if (!picked) return null;
    try {
      const ext = (picked.uri.split('.').pop() ?? 'jpg').split('?')[0];
      const path = `${profileId}/passport-${Date.now()}.${ext}`;
      const res = await fetch(picked.uri);
      const blob = await res.blob();
      const { error } = await supabase.storage.from('kyc').upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });
      if (error) {
        console.warn('[verify] upload failed', error.message);
        return null;
      }
      return path;
    } catch (err) {
      console.warn('[verify] upload exception', err);
      return null;
    }
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
      visa_expires_on: draft.visa_expires_on,
      family_size: draft.family_size,
      dependents: draft.dependents,
    };
    const { data, error } = await supabase
      .from('identity_graph')
      .upsert(payload, { onConflict: 'profile_id' })
      .select('*')
      .single();

    if (error) {
      setBusy(false);
      warn();
      Alert.alert('Could not save', error.message);
      return;
    }
    setIdentity(data);

    let submissionCreated = false;
    if (picked) {
      const passportPath = await uploadPassport(profile.id);
      if (passportPath) {
        const { error: subErr } = await supabase.from('verification_submissions').insert({
          profile_id: profile.id,
          passport_url: passportPath,
        });
        if (!subErr) submissionCreated = true;
      }
    }

    await supabase.from('events_log').insert({
      profile_id: profile.id,
      event_name: 'onboarding_complete',
      props: { verification_submitted: submissionCreated },
    });

    if (submissionCreated) {
      await supabase.from('events_log').insert({
        profile_id: profile.id,
        event_name: 'verification_submitted',
        props: {},
      });
    }

    registerForPushAsync(profile.id).catch(() => undefined);

    setBusy(false);
    reset();
    success();
    router.replace('/(tabs)');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-12">
        <Badge label="Verification" tone="marigold" />
        <Text variant="h1" className="mt-4">
          Verify with your passport.
        </Text>
        <Text variant="body" muted className="mt-2">
          Verified members can post in communities, leave reviews on Trusted vendors, and message
          verified vendors. Photo stays in our encrypted vault.
        </Text>

        <View className="mt-6 gap-3">
          <Card onPress={pickPassport}>
            <Text variant="h3">{picked ? 'Passport added ✓' : 'Upload passport photo'}</Text>
            <Text variant="small" muted>
              Photo page only. Auto-cropped, never shared.
            </Text>
          </Card>

          {picked ? (
            <Card>
              <Badge label="Pending review" tone="marigold" />
              <Text variant="small" muted className="mt-2">
                Most submissions are reviewed within 24 hours. You'll get a push notification.
              </Text>
            </Card>
          ) : null}
        </View>

        <View className="mt-8 gap-2">
          <Button
            title={picked ? 'Submit & enter SettleMe' : 'Save & enter SettleMe'}
            onPress={finish}
            loading={busy}
            fullWidth
            size="lg"
          />
          <Button
            title="Skip verification for now"
            onPress={finish}
            variant="ghost"
            disabled={!!picked}
          />
        </View>
      </View>
    </Screen>
  );
}
