import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
