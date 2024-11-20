import { SignIn, SignUp } from '@clerk/clerk-react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import GamePage from './pages/GamePage';
import LobbyPage from './pages/LobbyPage';
import ProfilePage from './pages/ProfilePage';
import WelcomePage from './pages/WelcomePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

      {/* Protected Routes */}
      <Route
        path="/lobby/:gameCode"
        element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:gameCode"
        element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      {/* Fallback for Undefined Routes */}
      <Route path="*" element={<WelcomePage />} />
    </Routes>
  );
}

export default AppRoutes;
