import { create } from 'zustand';

export interface OnboardingDraft {
  origin_country: string | null;
  dest_country: string | null;
  dest_city: string | null;
  corridor: string | null;
  arrival_date: string | null;
  visa_status: string | null;
  visa_expires_on: string | null;
  family_size: number;
  dependents: { name: string; relation: string }[];
}

interface OnboardingState {
  draft: OnboardingDraft;
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

const initial: OnboardingDraft = {
  origin_country: 'India',
  dest_country: 'UAE',
  dest_city: 'Dubai',
  corridor: 'in_ae',
  arrival_date: null,
  visa_status: null,
  visa_expires_on: null,
  family_size: 1,
  dependents: [],
};

export const useOnboarding = create<OnboardingState>((set) => ({
  draft: initial,
  set: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ draft: initial }),
}));
