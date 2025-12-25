import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import Sidebar from './components/Sidebar';

interface TerminalSession {
  id: string;
  title: string;
}

function Hello() {
  const [isFocused, setIsFocused] = useState(false);
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', title: 'Terminal 1' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');

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

  const createNewTerminal = () => {
    const newId = String(sessions.length + 1);
    const newSession = {
      id: newId,
      title: `Terminal ${newId}`
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newId);
  };

  const closeSession = (id: string) => {
    if (sessions.length === 1) return; // Don't close last terminal

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);

    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0].id);
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions(sessions.map(s =>
      s.id === id ? { ...s, title: newTitle } : s
    ));
  };

  return (
    <div className="flex h-screen text-white">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onSessionClose={closeSession}
        onCreateNew={createNewTerminal}
        onRenameSession={renameSession}
      />

      {/* Terminal area */}
      <div className="flex-1 flex flex-col">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex-1 ${activeSessionId === session.id ? 'block' : 'hidden'}`}
          >
            <Terminal
              className="w-full h-full"
              sessionId={session.id}
              autoRunCommand={session.id !== '1' ? 'claude' : undefined}
            />
          </div>
        ))}
      </div>
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
