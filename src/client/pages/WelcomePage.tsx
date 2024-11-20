import { useAuth } from '@client/hooks/useAuth';
import { useProfile } from '@client/hooks/useProfile';
import { MainMenu } from '@components/ui/MainMenu';
import { NotLoggedIn } from '@components/ui/NotLoggedIn';
import { ProfileOnboarding } from '@components/ui/ProfileOnboarding';

export default function WelcomePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();

  if (isAuthLoading || isProfileLoading) {
    // Loading is handled by the preloader in index.html
    return null;
  }

  // Not logged in
  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  // Logged in but needs onboarding
  if (!profile?.activeDeckId) {
    return <ProfileOnboarding />;
  }

  // Fully configured user
  return <MainMenu />;
}
