import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';

function Hello() {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Listen for window focus events from main process
    const unsubscribe = window.electron?.ipcRenderer.on(
      'window-focus',
      (...args: unknown[]) => {
        const isFocused = args[0] as boolean;
        setIsFocused(isFocused);
      },
    );

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen text-white">
      <Terminal className="flex-1" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
