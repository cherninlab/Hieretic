import { useAuth } from '@client/hooks/useAuth';
import { useProfile } from '@client/hooks/useProfile';
import { Button } from '@components/ui/Button';
import React from 'react';
import { Navigate } from 'react-router-dom';
import styles from './ProtectedRoute.module.css';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { profile, isLoading: isProfileLoading, error: profileError } = useProfile();

  // Add console logs for debugging
  console.log('Protected Route State:', {
    isAuthenticated,
    isAuthLoading,
    hasUser: !!user,
    hasProfile: !!profile,
    isProfileLoading,
    profileError,
  });

  if (isAuthLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading...</div>
        <div className={styles.loadingSubtext}>
          {isAuthLoading ? 'Checking authentication...' : 'Loading profile...'}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  if (profileError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>Error loading profile</div>
        <div className={styles.errorSubtext}>{profileError.message}</div>
        <Button onClick={() => window.location.reload()} className={styles.refreshButton}>
          Refresh Page
        </Button>
      </div>
    );
  }

  if (isAuthenticated && !profile && !isProfileLoading) {
    return (
      <div className={styles.initializingContainer}>
        <div className={styles.initializingText}>Creating Profile...</div>
      </div>
    );
  }

  return children;
}
