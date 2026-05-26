import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[SettleMe] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Copy .env.example to .env.local and fill them in.',
  );
}

const hasWindow = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const authStorage =
  Platform.OS === 'web' ? (hasWindow ? window.localStorage : noopStorage) : AsyncStorage;

export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-not-set',
  {
    auth: {
      storage: authStorage as never,
      autoRefreshToken: Platform.OS !== 'web' || hasWindow,
      persistSession: Platform.OS !== 'web' || hasWindow,
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
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type VerificationSubmission = {
  id: string;
  profile_id: string;
  passport_url: string;
  selfie_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  member_id: string;
  vendor_id: string;
  source: 'agent' | 'manual' | 'admin';
  status: 'open' | 'closed' | 'spam';
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_kind: 'member' | 'vendor' | 'system' | 'agent';
  sender_profile_id: string | null;
  sender_vendor_user_id: string | null;
  body: string;
  attachments: unknown;
  read_at: string | null;
  created_at: string;
};

export type Reminder = {
  id: string;
  profile_id: string;
  kind: 'visa_expiry' | 'event_rsvp' | 'agent_followup' | 'tax_deadline';
  fire_at: string;
  payload: Record<string, unknown>;
  channel: 'push' | 'inapp';
  fired_at: string | null;
  created_at: string;
};

export type VendorUser = {
  id: string;
  auth_user_id: string;
  vendor_id: string;
  role: 'owner' | 'agent';
  created_at: string;
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
