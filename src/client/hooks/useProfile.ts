import type { UserProfile } from '@shared/types';
import { useCallback } from 'react';
import superjson from 'superjson';
import useSWR from 'swr';
import { useProfileStore } from '../store/profileStore';
import { profileAPI } from '../utils/api-client';

export function useProfile() {
  const { profile, isLoading: storeLoading, error: storeError } = useProfileStore();

  // Get profile data with SWR if we have an ID
  const {
    data: profileData,
    error: fetchError,
    mutate: mutateProfile,
  } = useSWR(profile?.id ? `/profile?id=${profile.id}` : null, () =>
    profile?.id ? profileAPI.get(profile.id) : null,
  );

  // Create new profile
  const createProfile = useCallback(
    async (username: string) => {
      const data = await profileAPI.create(username);
      await mutateProfile();
      return data;
    },
    [mutateProfile],
  );

  // Update profile with debounce built in
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      try {
        await profileAPI.update(updates);
        await mutateProfile();
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },
    [mutateProfile],
  );

  let profileObj = profileData || profile;
  if (typeof profileObj !== 'object') {
    profileObj = superjson.parse(profileObj as string);
  }

  return {
    profile: profileObj as UserProfile,
    isLoading: storeLoading,
    error: storeError || fetchError,
    createProfile,
    updateProfile,
    mutateProfile,
  };
}
