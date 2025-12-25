import { useState } from 'react';

interface TerminalSession {
  id: string;
  title: string;
}

interface Repository {
  id: string;
  name: string;
  sourcePath: string;
  defaultBranch?: string;
}

interface SidebarProps {
  repository?: Repository;
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionClose: (id: string) => void;
  onCreateSession: (title?: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onGoHome?: () => void;
}

export default function Sidebar({
  repository,
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionClose,
  onCreateSession,
  onRenameSession,
  onGoHome,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (session: TerminalSession) => {
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const finishEditing = (id: string) => {
    if (editValue.trim()) {
      onRenameSession(id, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      finishEditing(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  return (
    <div className="w-64 flex flex-col bg-black/10 backdrop-blur-xl border-r border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        {repository ? (
          <div>
            <h2 className="text-sm font-semibold text-white/90 truncate">{repository.name}</h2>
            <p className="text-xs text-white/50 truncate">{repository.sourcePath}</p>
          </div>
        ) : (
          <h2 className="text-sm font-semibold text-white/90">Terminal</h2>
        )}
      </div>

      {/* Navigation Items */}
      <div className="px-2 py-3 border-b border-white/10">
        <button
          onClick={() => onCreateSession()}
          className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>

        {onGoHome && (
          <button
            onClick={onGoHome}
            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            All Repositories
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="text-xs font-semibold text-white/50 px-3 mb-2">SESSIONS</div>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative mb-1 ${
              activeSessionId === session.id ? 'bg-white/20' : 'hover:bg-white/10'
            } rounded-md transition-colors`}
          >
            {editingId === session.id ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => finishEditing(session.id)}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
                className="w-full px-3 py-2 bg-white/20 text-white text-sm outline-none rounded-md"
                autoFocus
              />
            ) : (
              <button
                onClick={() => onSessionSelect(session.id)}
                onDoubleClick={() => startEditing(session)}
                className="w-full px-3 py-2 flex items-center gap-2 text-sm text-white/90 text-left"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="flex-1 truncate">{session.title}</span>
              </button>
            )}
            {sessions.length > 1 && (
              <button
                onClick={() => onSessionClose(session.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white"
                title="Close session"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
