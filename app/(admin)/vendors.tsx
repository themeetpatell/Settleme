import { useState } from 'react';
import { View, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabase, type Vendor } from '@/lib/supabase';

type VendorUserRow = {
  id: string;
  auth_user_id: string;
  role: string;
  vendor: { id: string; name: string } | null;
};

export default function AdminVendors() {
  const queryClient = useQueryClient();
  const [authUserId, setAuthUserId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [busy, setBusy] = useState(false);

  const vendorsQuery = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, name, category, city, verified_at')
        .order('name', { ascending: true });
      return (
        (data as Pick<Vendor, 'id' | 'name' | 'category' | 'city' | 'verified_at'>[] | null) ?? []
      );
    },
  });

  const vendorUsersQuery = useQuery({
    queryKey: ['admin-vendor-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_users')
        .select('id, auth_user_id, role, vendor:vendors(id, name)')
        .order('created_at', { ascending: false });
      return (data as VendorUserRow[] | null) ?? [];
    },
  });

  async function provision() {
    if (!authUserId.trim() || !vendorId.trim()) {
      Alert.alert('Both fields required', 'Need an auth user id and a vendor id.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('vendor_users').insert({
      auth_user_id: authUserId.trim(),
      vendor_id: vendorId.trim(),
      role: 'owner',
    });
    setBusy(false);
    if (error) {
      Alert.alert('Could not provision', error.message);
      return;
    }
    setAuthUserId('');
    setVendorId('');
    queryClient.invalidateQueries({ queryKey: ['admin-vendor-users'] });
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-4">
        <Text variant="display">Vendors</Text>
        <Text variant="body" muted className="mt-1">
          Provision a SettleMe-signed-up auth user as a vendor portal user.
        </Text>

        <Card className="mt-6">
          <Badge label="Provision vendor user" tone="emerald" />
          <Text variant="small" muted className="mt-2">
            Vendor signs in once at /vendor/login to create their auth user. Grab the
            auth_user_id from Supabase Auth UI, paste below with the vendor UUID.
          </Text>
          <View className="mt-3 gap-2">
            <Input label="Auth user id (uuid)" value={authUserId} onChangeText={setAuthUserId} />
            <Input label="Vendor id (uuid)" value={vendorId} onChangeText={setVendorId} />
            <Button title="Provision" onPress={provision} loading={busy} fullWidth />
          </View>
        </Card>

        <View className="mt-8">
          <Text variant="h2">Vendor accounts</Text>
          <View className="mt-3 gap-2">
            {(vendorUsersQuery.data ?? []).map((vu) => (
              <Card key={vu.id}>
                <Text variant="h3">{vu.vendor?.name ?? 'unknown'}</Text>
                <Text variant="caption" muted className="mt-1">
                  role: {vu.role} · auth_user_id: {vu.auth_user_id}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        <View className="mt-8">
          <Text variant="h2">Vendors directory</Text>
          <View className="mt-3 gap-2">
            {(vendorsQuery.data ?? []).map((v) => (
              <Card key={v.id}>
                <Text variant="h3">{v.name}</Text>
                <Text variant="caption" muted className="mt-1">
                  {v.category} · {v.city}
                </Text>
                <Text variant="caption" muted className="mt-1">
                  id: {v.id}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
