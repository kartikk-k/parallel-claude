import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/dashboard';
import RepositoryView from './pages/RepositoryView';
import("react-grab");

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/repository/:repositoryId" element={<RepositoryView />} />
      </Routes>
    </Router>
  );
}
