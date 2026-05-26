// SettleMe — Expo push token registration.
//
// Requests permission (idempotent) and upserts the Expo push token into
// `push_tokens` for the current profile. Safe to call multiple times.
// On web the call is a no-op because Expo Web push requires a VAPID key
// we have not configured for v1.

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

let inflight: Promise<string | null> | null = null;

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId
  );
}

async function requestAndGetToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const ask = await Notifications.requestPermissionsAsync();
    status = ask.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = getProjectId();
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return token.data ?? null;
}

export async function registerForPushAsync(profileId: string): Promise<string | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const token = await requestAndGetToken();
      if (!token) return null;
      const platform: 'ios' | 'android' | 'web' =
        Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            profile_id: profileId,
            expo_token: token,
            platform,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'expo_token' },
        );
      if (error) {
        console.warn('[push] upsert token failed', error.message);
        return null;
      }
      return token;
    } catch (err) {
      console.warn('[push] register failed', err);
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
