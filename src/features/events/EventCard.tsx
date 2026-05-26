import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase, type EventRow } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';
import { success, warn } from '@/lib/haptics';

interface EventCardProps {
  event: EventRow;
  onPress?: () => void;
}

const KIND_TONE: Record<EventRow['kind'], 'marigold' | 'emerald' | 'terracotta' | 'default'> = {
  cultural: 'marigold',
  professional: 'default',
  family: 'emerald',
  social: 'terracotta',
  religious: 'marigold',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const profile = useIdentity((s) => s.profile);
  const queryClient = useQueryClient();

  const date = new Date(event.starts_at);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const rsvpQuery = useQuery({
    queryKey: ['rsvp', event.id, profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('event_rsvps')
        .select('status')
        .eq('event_id', event.id)
        .eq('profile_id', profile!.id)
        .maybeSingle();
      return (data?.status as string | undefined) ?? null;
    },
  });

  const rsvp = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Sign in required');

      const going = rsvpQuery.data === 'going';
      if (going) {
        await supabase
          .from('event_rsvps')
          .delete()
          .eq('event_id', event.id)
          .eq('profile_id', profile.id);
        return 'cancelled' as const;
      }

      await supabase.from('event_rsvps').upsert(
        { event_id: event.id, profile_id: profile.id, status: 'going' },
        { onConflict: 'event_id,profile_id' },
      );

      const fireAt = new Date(date.getTime() - 2 * 60 * 60 * 1000);
      if (fireAt.getTime() > Date.now()) {
        await supabase.from('reminders').insert({
          profile_id: profile.id,
          kind: 'event_rsvp',
          fire_at: fireAt.toISOString(),
          payload: { event_id: event.id, title: event.title, location: event.location },
        });
      }

      await supabase.from('events_log').insert({
        profile_id: profile.id,
        event_name: 'event_rsvp',
        props: { event_id: event.id, source: 'card' },
      });
      return 'going' as const;
    },
    onSuccess: (result) => {
      if (result === 'going') success();
      queryClient.invalidateQueries({ queryKey: ['rsvp', event.id, profile?.id] });
    },
    onError: () => warn(),
  });

  const isGoing = rsvpQuery.data === 'going';

  return (
    <Card onPress={onPress}>
      <Badge label={event.kind} tone={KIND_TONE[event.kind]} />
      <Text variant="h3" className="mt-2">
        {event.title}
      </Text>
      <Text variant="small" muted className="mt-1">
        {dateLabel} · {timeLabel} · {event.location ?? 'Online'}
      </Text>
      {event.host_name ? (
        <Text variant="caption" className="mt-2">
          Hosted by {event.host_name}
        </Text>
      ) : null}

      <View className="mt-3">
        <Button
          title={isGoing ? "You're going ✓ — tap to cancel" : 'RSVP'}
          variant={isGoing ? 'ghost' : 'primary'}
          size="sm"
          onPress={() => rsvp.mutate()}
          loading={rsvp.isPending}
          disabled={!profile?.id}
        />
      </View>
    </Card>
  );
}
