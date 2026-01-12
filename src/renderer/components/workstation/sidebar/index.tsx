import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SessionsList from './SessionsList';
import { Repository, SessionMetadata } from '../../../types';

interface SidebarProps {
  repository?: Repository;
  sessions: SessionMetadata[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionClose: (id: string) => void;
  onCreateSession: (title?: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onGoHome?: () => void;
  isCreatingSession?: boolean;
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
  isCreatingSession,
}: SidebarProps) {
  return (
    <div className="w-64 flex flex-col">
      <SidebarHeader repository={repository} />

      <SidebarNavigation
        onCreateSession={onCreateSession}
        onGoHome={onGoHome}
        isCreatingSession={isCreatingSession}
      />

      <SessionsList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={onSessionSelect}
        onSessionClose={onSessionClose}
        onRenameSession={onRenameSession}
      />
    </div>
  );
}
