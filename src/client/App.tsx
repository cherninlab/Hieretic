import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { initializeProfile } from './store/profileStore';
import './styles/global.css';

function App() {
  useEffect(() => {
    initializeProfile();
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
