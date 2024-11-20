import { useAuth, useUser } from '@clerk/clerk-react';
import { UserPreferences, UserProfile } from '@shared/types';
import { useEffect } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ProfileState {
  // State
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Basic Actions
  setProfile: (profile: UserProfile | null) => void;
  clearProfile: () => void;
  resetError: () => void;

  // Profile Management
  initializeProfile: () => Promise<void>;
  updateProfile: (updates: {
    username?: string;
    preferences?: Partial<UserPreferences>;
  }) => Promise<void>;

  // Game-related Actions
  updateActiveDeck: (deckId: string) => Promise<void>;
  fetchStatistics: () => Promise<void>;
}

const INITIAL_STATE = {
  profile: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        setProfile: (profile) => set({ profile, error: null }),
        clearProfile: () => set(INITIAL_STATE),
        resetError: () => set({ error: null }),

        initializeProfile: async () => {
          const { isInitialized, profile } = get();

          // Don't initialize twice
          if (isInitialized && profile) return;

          set({ isLoading: true, error: null });

          try {
            // Try to fetch existing profile first
            const response = await fetch('/api/profile');
            const data = await response.json();

            if (response.ok && data.success && data.data) {
              // Profile exists, just load it
              set({
                profile: data.data,
                isLoading: false,
                isInitialized: true,
              });
              return;
            }

            // If no profile exists (404) or other error, we'll create one
            // This should rarely happen as backend should auto-create profile
            throw new Error('Profile not found');
          } catch (error) {
            // Set error but don't prevent initialization
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize profile',
              isLoading: false,
              isInitialized: true,
            });
          }
        },

        updateProfile: async (updates) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error?.message || 'Failed to update profile');
            }

            set({ profile: data.data, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update profile',
              isLoading: false,
            });
          }
        },

        updateActiveDeck: async (deckId: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch('/api/profile/deck', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deckId }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error?.message || 'Failed to update active deck');
            }

            set({ profile: data.data, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update active deck',
              isLoading: false,
            });
          }
        },

        fetchStatistics: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch('/api/profile/stats');
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error?.message || 'Failed to fetch statistics');
            }

            const currentProfile = get().profile;
            if (!currentProfile) {
              throw new Error('No profile loaded');
            }

            set({
              profile: {
                ...currentProfile,
                statistics: data.data,
              },
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch statistics',
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'profile-storage',
        partialize: (state) => ({
          profile: state.profile,
          isInitialized: state.isInitialized,
        }),
      },
    ),
  ),
);

// Custom hook to handle profile initialization with Clerk
export function useProfileInit() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { initializeProfile } = useProfileStore();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      initializeProfile();
    }
  }, [isLoaded, isSignedIn, user, initializeProfile]);

  return useProfileStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
  }));
}

// Other utility hooks
export const useProfile = () => useProfileStore((state) => state.profile);
export const useProfileLoading = () => useProfileStore((state) => state.isLoading);
export const useProfileError = () => useProfileStore((state) => state.error);

// Action hooks
export const useProfileActions = () =>
  useProfileStore((state) => ({
    updateProfile: state.updateProfile,
    clearProfile: state.clearProfile,
    resetError: state.resetError,
  }));

export const useDeckActions = () =>
  useProfileStore((state) => ({
    updateActiveDeck: state.updateActiveDeck,
  }));

export const useStatsActions = () =>
  useProfileStore((state) => ({
    fetchStatistics: state.fetchStatistics,
  }));
