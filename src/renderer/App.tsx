import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';

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

  return (
    <div className="flex h-screen text-white bg-[#1e1e1e]">
      {/* Sidebar */}
      <div className="w-12 bg-[#252526] flex flex-col items-center py-2 border-r border-[#3e3e42]">
        {/* Session buttons */}
        {sessions.map((session, index) => (
          <div key={session.id} className="relative group">
            <button
              onClick={() => setActiveSessionId(session.id)}
              className={`w-10 h-10 rounded-md mb-2 flex items-center justify-center text-sm font-semibold transition-colors ${
                activeSessionId === session.id
                  ? 'bg-[#007acc] text-white'
                  : 'bg-[#3e3e42] text-gray-400 hover:bg-[#505050]'
              }`}
              title={session.title}
            >
              {index + 1}
            </button>
            {sessions.length > 1 && (
              <button
                onClick={() => closeSession(session.id)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                title="Close terminal"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* New Terminal button */}
        <button
          onClick={createNewTerminal}
          className="w-10 h-10 rounded-md flex items-center justify-center text-xl bg-[#3e3e42] text-gray-400 hover:bg-[#505050] hover:text-white transition-colors mt-auto"
          title="New Terminal (runs claude-code)"
        >
          +
        </button>
      </div>

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
