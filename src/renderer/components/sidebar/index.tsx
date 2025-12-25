import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import SessionsList from './SessionsList';

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
  return (
    <div className="w-64 flex flex-col bg-black/10 backdrop-blur-xl border-r border-white/10">
      <SidebarHeader repository={repository} />

      <SidebarNavigation
        onCreateSession={onCreateSession}
        onGoHome={onGoHome}
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
