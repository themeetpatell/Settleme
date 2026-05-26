import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

export default function AdminLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (mounted) {
          setAllowed(false);
          setChecked(true);
          router.replace('/(auth)/welcome');
        }
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (!mounted) return;
      const isAdmin = !!profile?.is_admin;
      setAllowed(isAdmin);
      setChecked(true);
      if (!isAdmin) router.replace('/(tabs)');
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Badge label="Admin" tone="terracotta" />
          <Text variant="display" className="mt-3 text-center">
            Admin tools are web-only.
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

  if (!allowed) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FBF8F2' },
        headerTintColor: '#0B0F1A',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'SettleMe Admin' }} />
      <Stack.Screen name="verification" options={{ title: 'Verification queue' }} />
      <Stack.Screen name="vendors" options={{ title: 'Vendors' }} />
    </Stack>
  );
}
