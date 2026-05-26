import { View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const [pendingVerif, agentChats, recentSignups, eventCounts] = await Promise.all([
        supabase
          .from('verification_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('source', 'agent'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 86_400_000).toISOString()),
        supabase
          .from('events_log')
          .select('event_name')
          .gte('created_at', new Date(Date.now() - 7 * 86_400_000).toISOString()),
      ]);

      const counts: Record<string, number> = {};
      for (const row of eventCounts.data ?? []) {
        counts[row.event_name] = (counts[row.event_name] ?? 0) + 1;
      }
      return {
        pendingVerif: pendingVerif.count ?? 0,
        agentChats: agentChats.count ?? 0,
        signups7d: recentSignups.count ?? 0,
        eventCounts: counts,
      };
    },
  });

  return (
    <Screen scroll>
      <View className="px-6 pt-4">
        <Text variant="display">SettleMe Admin</Text>
        <Text variant="body" muted className="mt-1">
          Verification queue, vendor provisioning, and the activation funnel.
        </Text>

        <View className="mt-6 gap-3">
          <Pressable onPress={() => router.push('/(admin)/verification')}>
            <Card>
              <View className="flex-row items-center justify-between">
                <View>
                  <Badge label="Verification" tone="marigold" />
                  <Text variant="h2" className="mt-2">
                    {data?.pendingVerif ?? '—'} pending
                  </Text>
                </View>
                <Text variant="small" className="text-emerald-700">
                  Review →
                </Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => router.push('/(admin)/vendors')}>
            <Card>
              <View className="flex-row items-center justify-between">
                <View>
                  <Badge label="Marketplace" tone="emerald" />
                  <Text variant="h2" className="mt-2">
                    {data?.agentChats ?? '—'} agent chats
                  </Text>
                  <Text variant="caption" muted className="mt-1">
                    Conversations opened by SettleMe agent
                  </Text>
                </View>
                <Text variant="small" className="text-emerald-700">
                  Vendors →
                </Text>
              </View>
            </Card>
          </Pressable>

          <Card>
            <Badge label="Last 7 days" tone="ink" />
            <Text variant="h2" className="mt-2">
              {data?.signups7d ?? '—'} new signups
            </Text>
            <View className="mt-3 gap-1">
              {[
                'signup',
                'onboarding_complete',
                'verification_submitted',
                'agent_question',
                'agent.tool_use',
                'vendor_message_sent',
                'event_rsvp',
                'reminder_fired',
              ].map((k) => (
                <View key={k} className="flex-row items-center justify-between">
                  <Text variant="small" muted>
                    {k}
                  </Text>
                  <Text variant="small">{data?.eventCounts?.[k] ?? 0}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
