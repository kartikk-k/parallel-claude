import { useState } from 'react';
import { useSessionManagerStore, SessionStatus } from '../../../stores';

interface TerminalSession {
  id: string;
  title: string;
}

interface SessionItemProps {
  session: TerminalSession;
  isActive: boolean;
  canClose: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export default function SessionItem({
  session,
  isActive,
  canClose,
  onSelect,
  onClose,
  onRename,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const { getSessionStatus } = useSessionManagerStore();
  const status = getSessionStatus(session.id);

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(session.title);
  };

  const finishEditing = () => {
    if (editValue.trim()) {
      onRename(session.id, editValue.trim());
    }
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

  const getStatusIndicator = (status: SessionStatus) => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-300 font-medium">RUNNING</span>
          </div>
        );
      case 'waiting_input':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] text-yellow-300 font-medium">INPUT</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[10px] text-green-300 font-medium">DONE</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] text-red-300 font-medium">ERROR</span>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="w-2 h-2 rounded-full bg-gray-500" />
        );
    }
  };

  return (
    <div
      className={`group relative mb-1 ${
        isActive ? 'bg-white/15' : 'hover:bg-white/10'
      } rounded-md transition-colors`}
    >
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 bg-white/20 text-white text-sm outline-none rounded-md font-medium"
          autoFocus
        />
      ) : (
        <button
          onClick={() => onSelect(session.id)}
          onDoubleClick={startEditing}
          className="w-full px-3 py-2 flex flex-col gap-1 text-sm text-white/80 text-left"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="flex-1 truncate font-medium">{session.title}</span>
          </div>
          <div className="pl-6">
            {getStatusIndicator(status)}
          </div>
        </button>
      )}
      {canClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(session.id);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white"
          title="Close session"
        >
          ×
        </button>
      )}
    </div>
  );
}
