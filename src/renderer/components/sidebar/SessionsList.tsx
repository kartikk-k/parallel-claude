import SessionItem from './SessionItem';

interface TerminalSession {
  id: string;
  title: string;
}

interface SessionsListProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionClose: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export default function SessionsList({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionClose,
  onRenameSession,
}: SessionsListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-2 py-3">
      <div className="text-xs font-medium text-text-muted px-3 mb-2 uppercase tracking-wider">
        Sessions
      </div>
      {sessions.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-text-muted">No sessions yet</p>
          <p className="text-xs text-text-faint mt-1">Create one to get started</p>
        </div>
      ) : (
        sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={activeSessionId === session.id}
            canClose={sessions.length > 1}
            onSelect={onSessionSelect}
            onClose={onSessionClose}
            onRename={onRenameSession}
          />
        ))
      )}
    </div>
  );
}
