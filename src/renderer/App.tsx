import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/dashboard';
import Workstation from './components/workstation';
import { ROUTES } from './constants';
import("react-grab");

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<Dashboard />} />
        <Route path={ROUTES.WORKSTATION} element={<Workstation />} />
      </Routes>
    </Router>
  );
}
