import { Stack } from 'expo-router';

export default function MessagingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FBF8F2' },
        headerTintColor: '#0B0F1A',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="inbox" options={{ title: 'Messages' }} />
      <Stack.Screen name="[id]" options={{ title: 'Chat' }} />
    </Stack>
  );
}
