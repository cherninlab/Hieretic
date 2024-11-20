import { Route, Routes } from 'react-router-dom';
import GamePage from './pages/GamePage';
import LobbyPage from './pages/LobbyPage';
import ProfilePage from './pages/ProfilePage';
import WelcomePage from './pages/WelcomePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/lobby/:gameCode" element={<LobbyPage />} />
      <Route path="/game/:gameCode" element={<GamePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      {/* Fallback for Undefined Routes */}
      <Route path="*" element={<WelcomePage />} />
    </Routes>
  );
}

export default AppRoutes;
