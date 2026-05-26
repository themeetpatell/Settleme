import { create } from 'zustand';
import type { IdentityGraph, Profile } from '@/lib/supabase';

interface IdentityState {
  profile: Profile | null;
  identity: IdentityGraph | null;
  isVendor: boolean;
  hydrated: boolean;
  setProfile: (p: Profile | null) => void;
  setIdentity: (i: IdentityGraph | null) => void;
  setIsVendor: (v: boolean) => void;
  markHydrated: () => void;
  reset: () => void;
}

export const useIdentity = create<IdentityState>((set) => ({
  profile: null,
  identity: null,
  isVendor: false,
  hydrated: false,
  setProfile: (profile) => set({ profile }),
  setIdentity: (identity) => set({ identity }),
  setIsVendor: (isVendor) => set({ isVendor }),
  markHydrated: () => set({ hydrated: true }),
  reset: () => set({ profile: null, identity: null, isVendor: false }),
}));
