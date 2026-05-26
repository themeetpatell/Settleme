import { useState } from 'react';
import { View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GradientCover } from '@/components/ui/GradientCover';
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
      <View className="px-6 pt-6">
        <GradientCover
          palette="sunset"
          radius={28}
          className="h-32 items-center justify-center shadow-e3"
        >
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/95 shadow-e1">
            <Ionicons name="shield-checkmark-outline" size={28} color="#9A5814" />
          </View>
        </GradientCover>

        <View className="mt-6">
          <Badge label="Verification" tone="marigold" dot />
          <Text variant="h1" className="mt-3">
            Verify with your passport.
          </Text>
          <Text variant="body" muted className="mt-2">
            Verified members can post in communities, leave reviews on Trusted vendors, and message
            verified vendors. Your photo stays in our encrypted vault.
          </Text>
        </View>

        <View className="mt-6 gap-3">
          <Card onPress={pickPassport} elevation={picked ? 2 : 1}>
            <View className="flex-row items-center gap-3">
              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${
                  picked ? 'bg-emerald-100' : 'bg-sand-100 dark:bg-ink-700'
                }`}
              >
                <Ionicons
                  name={picked ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={22}
                  color={picked ? '#125E40' : '#0A0E17'}
                />
              </View>
              <View className="flex-1">
                <Text variant="h3">
                  {picked ? 'Passport added' : 'Upload passport photo'}
                </Text>
                <Text variant="small" muted className="mt-0.5">
                  Photo page only. Auto-cropped, never shared.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5A6677" />
            </View>
          </Card>

          {picked ? (
            <Card variant="tinted" tone="marigold">
              <View className="flex-row items-start gap-3">
                <Ionicons name="hourglass-outline" size={18} color="#9A5814" />
                <View className="flex-1">
                  <Text variant="h3">Pending review</Text>
                  <Text variant="small" className="mt-1 text-marigold-700 dark:text-marigold-300">
                    Most submissions are reviewed within 24 hours. You'll get a push notification.
                  </Text>
                </View>
              </View>
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
