import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { tap } from '@/lib/haptics';

const TABS: {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'ask', title: 'Ask', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { name: 'community', title: 'People', icon: 'people-outline', iconActive: 'people' },
  { name: 'events', title: 'Events', icon: 'calendar-outline', iconActive: 'calendar' },
  {
    name: 'trusted',
    title: 'Trusted',
    icon: 'shield-checkmark-outline',
    iconActive: 'shield-checkmark',
  },
  { name: 'profile', title: 'You', icon: 'person-outline', iconActive: 'person' },
];

const ACTIVE = '#0A0E17';
const INACTIVE = '#8A95A6';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FBF8F2',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 86,
          paddingTop: 10,
          paddingBottom: 26,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => tap(),
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <View
                className={`h-9 w-12 items-center justify-center ${
                  focused ? 'rounded-full bg-ink-100/70 dark:bg-ink-700/70' : ''
                }`}
              >
                <Ionicons name={focused ? t.iconActive : t.icon} size={20} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
