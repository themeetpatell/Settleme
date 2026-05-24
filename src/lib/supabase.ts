import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[SettleMe] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-not-set',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export type Profile = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IdentityGraph = {
  profile_id: string;
  origin_country: string | null;
  dest_country: string | null;
  dest_city: string | null;
  corridor: string | null;
  arrival_date: string | null;
  visa_status: string | null;
  visa_expires_on: string | null;
  family_size: number | null;
  dependents: unknown;
  preferred_language: string | null;
  updated_at: string;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  kind: 'city' | 'diaspora' | 'interest' | 'professional' | 'family';
  city: string | null;
  diaspora: string | null;
  description: string | null;
  member_count: number;
  cover_url: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  host_name: string | null;
  description: string | null;
  city: string;
  diaspora: string | null;
  kind: 'cultural' | 'professional' | 'family' | 'social' | 'religious';
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  capacity: number | null;
  cover_url: string | null;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  city: string;
  diaspora: string | null;
  description: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  rating: number;
  review_count: number;
  verified_at: string | null;
  cover_url: string | null;
};

export type AiThread = {
  id: string;
  profile_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AiMessage = {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: unknown;
  model: string | null;
  usage: unknown;
  created_at: string;
};
