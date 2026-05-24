import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import type { EventRow } from '@/lib/supabase';

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
  const date = new Date(event.starts_at);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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
    </Card>
  );
}
