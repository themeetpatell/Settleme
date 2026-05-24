import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import type { Community } from '@/lib/supabase';

interface CommunityCardProps {
  community: Community;
  onPress?: () => void;
}

const KIND_LABEL: Record<Community['kind'], string> = {
  city: 'City',
  diaspora: 'Diaspora',
  interest: 'Interest',
  professional: 'Professional',
  family: 'Family',
};

export function CommunityCard({ community, onPress }: CommunityCardProps) {
  return (
    <Card onPress={onPress}>
      <Badge label={KIND_LABEL[community.kind]} tone="marigold" />
      <Text variant="h3" className="mt-2">
        {community.name}
      </Text>
      {community.description ? (
        <Text variant="small" muted className="mt-1">
          {community.description}
        </Text>
      ) : null}
      <Text variant="caption" className="mt-3">
        {community.member_count.toLocaleString()} verified members
      </Text>
    </Card>
  );
}
