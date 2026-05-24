import { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { success, warn } from '@/lib/haptics';

export default function Login() {
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
      warn();
      setError(error.message);
      return;
    }
    success();
    setOtpSent(true);
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) {
      warn();
      setError(error.message);
      return;
    }
    success();
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-12">
        <Text variant="h1">Sign in</Text>
        <Text variant="body" muted className="mt-2">
          We'll email you a one-time code. No passwords.
        </Text>

        <View className="mt-8 gap-3">
          <Input
            label="Email"
            placeholder="you@example.com"
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
              <Button title="Verify & continue" onPress={verifyCode} loading={busy} fullWidth size="lg" />
            ) : (
              <Button title="Email me a code" onPress={sendCode} loading={busy} fullWidth size="lg" disabled={!email.includes('@')} />
            )}
          </View>

          {otpSent ? (
            <Button title="Use a different email" onPress={() => setOtpSent(false)} variant="ghost" />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
