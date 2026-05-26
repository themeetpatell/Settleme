import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

export default function VendorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOtpSent(true);
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error || !data.session) {
      setError(error?.message ?? 'Verification failed');
      return;
    }

    const { data: vu } = await supabase
      .from('vendor_users')
      .select('id')
      .eq('auth_user_id', data.session.user.id)
      .maybeSingle();

    if (!vu) {
      setError(
        'This email is not yet provisioned as a SettleMe vendor. Contact your SettleMe admin to be added.',
      );
      await supabase.auth.signOut();
      return;
    }
    router.replace('/(vendor)/inbox');
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-10">
        <Badge label="Vendor portal" tone="ink" />
        <Text variant="h1" className="mt-3">
          Sign in to SettleMe Vendor.
        </Text>
        <Text variant="body" muted className="mt-2">
          One-time code by email. We'll route you to your inbox of inbound members.
        </Text>

        <View className="mt-8 gap-3">
          <Input
            label="Email"
            placeholder="you@yourcompany.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!otpSent}
          />

          {otpSent ? (
            <Input
              label="6-digit code"
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              error={error}
            />
          ) : error ? (
            <Text variant="small" className="text-terracotta-500">
              {error}
            </Text>
          ) : null}

          <View className="mt-2">
            {otpSent ? (
              <Button
                title="Verify & continue"
                onPress={verifyCode}
                loading={busy}
                fullWidth
                size="lg"
              />
            ) : (
              <Button
                title="Email me a code"
                onPress={sendCode}
                loading={busy}
                fullWidth
                size="lg"
                disabled={!email.includes('@')}
              />
            )}
          </View>

          {otpSent ? (
            <Button
              title="Use a different email"
              onPress={() => setOtpSent(false)}
              variant="ghost"
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
