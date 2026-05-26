import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase, type Community } from '@/lib/supabase';
import { useIdentity } from '@/state/identity';
import { communityImage } from '@/lib/aiImage';
import { success, warn } from '@/lib/haptics';

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
  const profile = useIdentity((s) => s.profile);
  const queryClient = useQueryClient();

  const membershipQuery = useQuery({
    queryKey: ['community-member', community.id, profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('community_members')
        .select('profile_id')
        .eq('community_id', community.id)
        .eq('profile_id', profile!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Sign in required');
      const joined = membershipQuery.data;
      if (joined) {
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('profile_id', profile.id);
        return 'left' as const;
      }
      await supabase.from('community_members').insert({
        community_id: community.id,
        profile_id: profile.id,
      });
      await supabase.from('events_log').insert({
        profile_id: profile.id,
        event_name: 'community_join',
        props: { community_id: community.id },
      });
      return 'joined' as const;
    },
    onSuccess: (r) => {
      if (r === 'joined') success();
      queryClient.invalidateQueries({ queryKey: ['community-member', community.id, profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: () => warn(),
  });

  const isMember = membershipQuery.data === true;
  const imageUrl = communityImage(community.id, community.kind);

  return (
    <Card onPress={onPress}>
      <View className="flex-row gap-4">
        <View className="h-20 w-20 overflow-hidden rounded-2xl bg-sand-100 dark:bg-ink-700">
          <Image
            source={{ uri: imageUrl }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
          />
        </View>
        <View className="flex-1">
          <Badge label={KIND_LABEL[community.kind]} tone="marigold" />
          <Text variant="h3" className="mt-2">
            {community.name}
          </Text>
          {community.description ? (
            <Text variant="small" muted className="mt-1" numberOfLines={2}>
              {community.description}
            </Text>
          ) : null}
          <Text variant="caption" className="mt-2">
            {community.member_count.toLocaleString()} verified members
          </Text>
        </View>
      </View>

      <View className="mt-4">
        <Button
          title={isMember ? 'Joined ✓ — tap to leave' : 'Join'}
          variant={isMember ? 'ghost' : 'primary'}
          size="sm"
          onPress={() => toggle.mutate()}
          loading={toggle.isPending}
          disabled={!profile?.id}
        />
      </View>
    </Card>
  );
}
