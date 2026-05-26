import { useState } from 'react';
import { View, Image, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { supabase, type VerificationSubmission } from '@/lib/supabase';

type SubmissionWithProfile = VerificationSubmission & {
  profile: { display_name: string | null; verified_at: string | null } | null;
};

async function fetchSignedUrl(path: string): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;
  const fnUrl =
    (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace('supabase.co', 'functions.supabase.co') +
    '/admin-signed-url';
  try {
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  } catch {
    return null;
  }
}

export default function AdminVerification() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('verification_submissions')
        .select('*, profile:profiles(display_name, verified_at)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      return (data as SubmissionWithProfile[] | null) ?? [];
    },
  });

  async function openSubmission(s: SubmissionWithProfile) {
    setActiveId(s.id);
    setPreviewUrl(null);
    setRejectionReason('');
    const url = await fetchSignedUrl(s.passport_url);
    setPreviewUrl(url);
  }

  async function approve(s: SubmissionWithProfile) {
    setBusy(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const adminAuthUid = sessionData.session?.user.id;
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', adminAuthUid)
      .maybeSingle();

    await supabase
      .from('verification_submissions')
      .update({
        status: 'approved',
        reviewed_by: adminProfile?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', s.id);

    await supabase
      .from('profiles')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', s.profile_id);

    setBusy(false);
    setActiveId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  }

  async function reject(s: SubmissionWithProfile) {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason required', 'Add a short reason so the member knows what to fix.');
      return;
    }
    setBusy(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const adminAuthUid = sessionData.session?.user.id;
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', adminAuthUid)
      .maybeSingle();

    await supabase
      .from('verification_submissions')
      .update({
        status: 'rejected',
        reviewed_by: adminProfile?.id ?? null,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim(),
      })
      .eq('id', s.id);

    setBusy(false);
    setActiveId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
  }

  const active = (data ?? []).find((s) => s.id === activeId) ?? null;

  return (
    <Screen scroll>
      <View className="px-6 pt-4">
        <Text variant="display">Verification queue</Text>

        {isLoading ? (
          <Text variant="small" muted className="mt-4">
            Loading…
          </Text>
        ) : (data ?? []).length === 0 ? (
          <EmptyState title="Inbox zero" body="No pending verifications. Nice." />
        ) : (
          <View className="mt-6 gap-3">
            {(data ?? []).map((s) => (
              <Card key={s.id} onPress={() => openSubmission(s)}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text variant="h3">{s.profile?.display_name ?? 'New member'}</Text>
                    <Text variant="caption" muted className="mt-1">
                      Submitted {new Date(s.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Badge label="Pending" tone="marigold" />
                </View>
              </Card>
            ))}
          </View>
        )}

        {active ? (
          <Card className="mt-6">
            <Text variant="h2">{active.profile?.display_name ?? 'Member'}</Text>
            <Text variant="caption" muted className="mt-1">
              Profile id: {active.profile_id}
            </Text>

            <View className="mt-4">
              {previewUrl ? (
                <Image
                  source={{ uri: previewUrl }}
                  style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 12 }}
                  resizeMode="contain"
                />
              ) : (
                <Text variant="small" muted>
                  Loading passport preview…
                </Text>
              )}
            </View>

            <View className="mt-4">
              <Input
                label="If rejecting, give a reason"
                placeholder="e.g. passport page unclear"
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />
            </View>

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button title="Approve" onPress={() => approve(active)} loading={busy} fullWidth />
              </View>
              <View className="flex-1">
                <Button
                  title="Reject"
                  variant="ghost"
                  onPress={() => reject(active)}
                  loading={busy}
                  fullWidth
                />
              </View>
            </View>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
