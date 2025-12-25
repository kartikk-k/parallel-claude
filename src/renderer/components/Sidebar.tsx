import { useState } from 'react';

interface TerminalSession {
  id: string;
  title: string;
}

interface SidebarProps {
  sessions: TerminalSession[];
  activeSessionId: string;
  onSessionSelect: (id: string) => void;
  onSessionClose: (id: string) => void;
  onCreateNew: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionClose,
  onCreateNew,
  onRenameSession,
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
        <h2 className="text-sm font-semibold text-white/90">Terminal</h2>
      </div>

      {/* Navigation Items */}
      <div className="px-2 py-3 border-b border-white/10">
        <button
          onClick={onCreateNew}
          className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>

        <button className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Open Folder
        </button>

        <button className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          GitHub
        </button>

        <button className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/80 hover:bg-white/10 rounded-md transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Support
        </button>
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
