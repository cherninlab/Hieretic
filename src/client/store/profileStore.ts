import type { UserProfile } from '@shared/types';
import superjson from 'superjson';
import { create } from 'zustand';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchProfile: (id: string) => Promise<boolean>;
  createProfile: () => Promise<string>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  initialized: false,

  fetchProfile: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/profile?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const responseObj = await response.json();

      if (responseObj.success && responseObj.data) {
        let profile = responseObj.data;
        if (typeof profile !== 'object' || !profile.id) {
          profile = superjson.parse(profile);
        }
        set({ profile, initialized: true });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch profile' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  createProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({ username: `Player-${Date.now()}` }),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      const responseObj = await response.json();
      if (!responseObj.success || !responseObj.data) {
        throw new Error('Invalid profile creation response');
      }

      let profile = responseObj.data;
      if (typeof profile !== 'object' || !profile.id) {
        profile = superjson.parse(profile);
      }
      set({ profile, initialized: true });
      return profile.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create profile' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile?.id) return;

    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({ ...profile, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const responseObj = await response.json();
      if (responseObj.success && responseObj.data) {
        set({ profile: responseObj.data });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Initialize profile on app start
export async function initializeProfile() {
  const store = useProfileStore.getState();
  if (store.initialized) return;

  try {
    const profileId = localStorage.getItem('profileId');

    if (profileId) {
      const exists = await store.fetchProfile(profileId);
      if (!exists) {
        localStorage.removeItem('profileId');
        const newId = await store.createProfile();
        localStorage.setItem('profileId', newId);
      }
    } else {
      const newId = await store.createProfile();
      localStorage.setItem('profileId', newId);
    }
  } catch (error) {
    console.error('Failed to initialize profile:', error);
  }
}
