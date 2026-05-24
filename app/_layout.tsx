import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const profile = useIdentity((s) => s.profile);
  const identity = useIdentity((s) => s.identity);
  const hydrated = useIdentity((s) => s.hydrated);
  const setProfile = useIdentity((s) => s.setProfile);
  const setIdentity = useIdentity((s) => s.setIdentity);
  const markHydrated = useIdentity((s) => s.markHydrated);

  useEffect(() => {
    let mounted = true;

    const loadFor = async (authUserId: string | null) => {
      if (!authUserId) {
        if (mounted) {
          setProfile(null);
          setIdentity(null);
          markHydrated();
        }
        return;
      }
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (!mounted) return;
      setProfile(p ?? null);
      if (p) {
        const { data: i } = await supabase
          .from('identity_graph')
          .select('*')
          .eq('profile_id', p.id)
          .maybeSingle();
        if (mounted) setIdentity(i ?? null);
      } else {
        setIdentity(null);
      }
      markHydrated();
    };

    supabase.auth.getSession().then(({ data }) => loadFor(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadFor(session?.user.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setProfile, setIdentity, markHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0] ?? '';
    const signedIn = !!profile;
    const onboarded = !!identity?.corridor;

    if (!signedIn && group !== '(auth)') {
      router.replace('/(auth)/welcome');
    } else if (signedIn && !onboarded && group !== '(onboarding)') {
      router.replace('/(onboarding)/corridor');
    } else if (signedIn && onboarded && (group === '(auth)' || group === '(onboarding)')) {
      router.replace('/(tabs)');
    }
  }, [hydrated, profile, identity, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FBF8F2' } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
