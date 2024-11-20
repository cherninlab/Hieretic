import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useCallback } from 'react';
import { useProfileStore } from '../store/profileStore';

export function useAuth() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useClerkAuth();
  const { user } = useUser();
  const store = useProfileStore();

  // Use callback to prevent recreation of function
  const clearProfile = useCallback(() => {
    if (!isSignedIn && store.profile) {
      store.clearProfile();
    }
  }, [isSignedIn, store]);

  // Call clearProfile when needed
  clearProfile();

  return {
    isAuthenticated: isSignedIn,
    isLoading: !isAuthLoaded || store.isLoading,
    user,
    error: store.error,
    profile: store.profile,
    isInitialized: store.isInitialized,
    isReady: isAuthLoaded && store.isInitialized,
    shouldCreateProfile: isSignedIn && !store.profile && !store.isLoading && store.isInitialized,
  };
}
