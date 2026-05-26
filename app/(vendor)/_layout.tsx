import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';

export default function VendorLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const last = segments[segments.length - 1];
      const onLogin = last === 'login';

      if (!session) {
        if (mounted) {
          setAllowed(onLogin);
          setChecked(true);
          if (!onLogin) router.replace('/(vendor)/login');
        }
        return;
      }

      const { data: vendorUser } = await supabase
        .from('vendor_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (!vendorUser) {
        setAllowed(false);
        setChecked(true);
        await supabase.auth.signOut();
        router.replace('/(vendor)/login');
        return;
      }

      setAllowed(true);
      setChecked(true);
      if (onLogin) router.replace('/(vendor)/inbox');
    })();
    return () => {
      mounted = false;
    };
  }, [segments, router]);

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Text variant="display" className="text-center">
            SettleMe Vendor Portal
          </Text>
          <Text variant="body" muted className="mt-3 text-center">
            The vendor portal is web-only for now. Open the link on a laptop or desktop.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!checked) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text variant="small" muted>
            Loading…
          </Text>
        </View>
      </Screen>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FBF8F2' },
        headerTintColor: '#0B0F1A',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Vendor sign-in' }} />
      <Stack.Screen name="inbox" options={{ title: 'Vendor inbox' }} />
      <Stack.Screen name="[id]" options={{ title: 'Chat' }} />
    </Stack>
  );
}
