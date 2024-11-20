import type { UserProfile } from '@shared/types';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { useAuth } from './useAuth';

interface UseProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  mutateProfile: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const {
    data: profile,
    error: fetchError,
    mutate: mutateProfile,
  } = useSWR<UserProfile>(
    // Only fetch if we're authenticated
    isAuthenticated ? `/api/profile` : null,
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch profile');
        }
        return data.data;
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: true,
      // Don't revalidate too often
      dedupingInterval: 5000,
      // Keep data when switching windows/tabs
      revalidateOnReconnect: false,
      // If no profile exists, backend should auto-create it
      shouldRetryOnError: false,
    },
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      if (!profile) {
        throw new Error('No profile to update');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to update profile');
        }

        // Update the cache with the new data
        await mutateProfile();
      } catch (error) {
        console.error('Profile update error:', error);
        setError(error instanceof Error ? error : new Error('Failed to update profile'));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [profile, mutateProfile],
  );

  return {
    profile: profile || null,
    // We're loading if either auth is loading or we're actively loading profile data
    isLoading: isAuthLoading || isLoading,
    error: error || fetchError || null,
    updateProfile,
    mutateProfile: async () => {
      try {
        await mutateProfile();
      } catch (error) {
        console.error('Profile mutation error:', error);
        throw error;
      }
    },
  };
}

export type { UseProfileResult };
