import { View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EventCard } from '@/features/events/EventCard';
import { CommunityCard } from '@/features/community/CommunityCard';
import { supabase, type EventRow, type Community } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  return Math.ceil((target - Date.now()) / 86_400_000);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function Home() {
  const router = useRouter();
  const profile = useIdentity((s) => s.profile);
  const identity = useIdentity((s) => s.identity);

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there';
  const city = identity?.dest_city ?? 'Dubai';

  const eventsQuery = useQuery({
    queryKey: ['home-events', city],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('city', city)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3);
      return (data as EventRow[] | null) ?? [];
    },
  });

  const communitiesQuery = useQuery({
    queryKey: ['home-communities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(3);
      return (data as Community[] | null) ?? [];
    },
  });

  const verificationQuery = useQuery({
    queryKey: ['home-verification', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('verification_submissions')
        .select('status, created_at')
        .eq('profile_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { status: string; created_at: string } | null;
    },
  });

  const visaDays = identity?.visa_expires_on ? daysUntil(identity.visa_expires_on) : null;
  const isVerified = !!profile?.verified_at;
  const pendingVerif = verificationQuery.data?.status === 'pending';

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text variant="caption">
          {greeting().toUpperCase()} · {city.toUpperCase()}
        </Text>
        <Text variant="display" className="mt-1">
          Hello, {firstName}.
        </Text>

        {!isVerified ? (
          <Card
            variant="tinted"
            tone="marigold"
            className="mt-5"
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-marigold-200 dark:bg-marigold-800">
                <Ionicons
                  name={pendingVerif ? 'hourglass-outline' : 'shield-outline'}
                  size={18}
                  color="#9A5814"
                />
              </View>
              <View className="flex-1">
                <Text variant="h3">
                  {pendingVerif ? 'Verification pending review' : 'Verify to unlock community'}
                </Text>
                <Text variant="caption" muted className="mt-0.5">
                  {pendingVerif
                    ? 'We usually review within 24 hours.'
                    : 'Upload your passport to post and message vendors.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#5A6677" />
            </View>
          </Card>
        ) : null}

        {visaDays !== null && visaDays >= 0 ? (
          <Card variant="hero" className="mt-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text variant="caption" tone="inverse" className="opacity-70">
                  RESIDENCE VISA · {identity?.visa_status?.toUpperCase() ?? 'VISA'}
                </Text>
                <Text variant="display" tone="inverse" className="mt-2">
                  {visaDays}{' '}
                  <Text variant="h2" tone="inverse" className="opacity-70">
                    days
                  </Text>
                </Text>
                <Text variant="small" tone="inverse" className="mt-1 opacity-70">
                  Expires{' '}
                  {new Date(identity!.visa_expires_on!).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View className="rounded-2xl bg-marigold-400 px-3 py-1.5">
                <Text variant="caption" className="font-bold text-ink-900">
                  RENEW PLAYBOOK
                </Text>
              </View>
            </View>
            <View className="mt-4">
              <Button
                title="Ask SettleMe to help"
                variant="accent"
                size="sm"
                onPress={() => router.push('/(tabs)/ask')}
              />
            </View>
          </Card>
        ) : null}

        <Pressable onPress={() => router.push('/(tabs)/ask')} className="mt-3">
          <Card>
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Badge label="Ask SettleMe" tone="marigold" dot />
                <Text variant="h2" className="mt-2">
                  What's on your mind?
                </Text>
                <Text variant="small" muted className="mt-1.5">
                  Banking, visa, neighbourhoods, schools — I'll find vendors, set reminders, even
                  draft the message for you.
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-marigold-500">
                <Ionicons name="sparkles" size={20} color="#0A0E17" />
              </View>
            </View>
          </Card>
        </Pressable>

        <View className="mt-9">
          <SectionHeader
            eyebrow="THIS WEEK"
            title="Events in your city"
            action={
              <Button
                title="See all"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(tabs)/events')}
              />
            }
          />
          <View className="mt-3 gap-3">
            {eventsQuery.isLoading ? (
              <>
                <Skeleton height={120} radius={24} />
                <Skeleton height={120} radius={24} />
              </>
            ) : (eventsQuery.data ?? []).length === 0 ? (
              <Card>
                <Text variant="body" muted>
                  No upcoming events in {city} yet. Check back soon.
                </Text>
              </Card>
            ) : (
              (eventsQuery.data ?? []).map((e) => <EventCard key={e.id} event={e} />)
            )}
          </View>
        </View>

        <View className="mt-9">
          <SectionHeader
            eyebrow="YOUR PEOPLE"
            title="Communities to join"
            action={
              <Button
                title="See all"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(tabs)/community')}
              />
            }
          />
          <View className="mt-3 gap-3">
            {communitiesQuery.isLoading ? (
              <>
                <Skeleton height={110} radius={24} />
                <Skeleton height={110} radius={24} />
              </>
            ) : (
              (communitiesQuery.data ?? []).map((c) => <CommunityCard key={c.id} community={c} />)
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}
