import { useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/dashboard';
import Workstation from './components/workstation';
import { ROUTES } from './constants';
import("react-grab");

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for navigation requests from main process
    const unsubscribe = window.electron?.ipcRenderer.on('navigate-to', (route: string) => {
      navigate(route);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Dashboard />} />
      <Route path={ROUTES.WORKSTATION} element={<Workstation />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
