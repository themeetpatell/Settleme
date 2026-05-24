import { create } from 'zustand';
import type { IdentityGraph, Profile } from '@/lib/supabase';

interface IdentityState {
  profile: Profile | null;
  identity: IdentityGraph | null;
  hydrated: boolean;
  setProfile: (p: Profile | null) => void;
  setIdentity: (i: IdentityGraph | null) => void;
  markHydrated: () => void;
  reset: () => void;
}

export const useIdentity = create<IdentityState>((set) => ({
  profile: null,
  identity: null,
  hydrated: false,
  setProfile: (profile) => set({ profile }),
  setIdentity: (identity) => set({ identity }),
  markHydrated: () => set({ hydrated: true }),
  reset: () => set({ profile: null, identity: null }),
}));
