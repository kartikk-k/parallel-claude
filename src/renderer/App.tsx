import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import RepositoryView from './pages/RepositoryView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/repository/:repositoryId" element={<RepositoryView />} />
      </Routes>
    </Router>
  );
}
