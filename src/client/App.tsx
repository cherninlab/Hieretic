import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import styles from './styles/App.module.css';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className={styles.app}>
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
