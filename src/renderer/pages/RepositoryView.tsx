import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import Terminal from '../components/Terminal';
import GitSidebar from '../components/GitSidebar';

interface Repository {
  id: string;
  name: string;
  slug: string;
  sourcePath: string;
  defaultBranch: string;
  sessionIds: string[];
}

interface SessionMetadata {
  id: string;
  repositoryId: string;
  title: string;
  branchName: string;
  baseBranch: string;
  createdAt: string;
  workingDirectory: string;
  autoRunCommand?: string;
  isRunning: boolean;
  status: string;
}

export default function RepositoryView() {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const navigate = useNavigate();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (repositoryId) {
      loadRepository();
    }
  }, [repositoryId]);

  const loadRepository = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [repo, sessionsList] = await Promise.all([
        window.electron.ipcRenderer.invoke('repository:get', repositoryId),
        window.electron.ipcRenderer.invoke('session:getByRepository', repositoryId),
      ]);

      if (!repo) {
        setError('Repository not found');
        return;
      }

      setRepository(repo);
      setSessions(sessionsList);

      // Set active session to first one if exists
      if (sessionsList.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load repository:', err);
      setError('Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (title?: string) => {
    try {
      setError(null);
      const newSession = await window.electron.ipcRenderer.invoke(
        'session:create',
        repositoryId,
        {
          title: title || `Session ${sessions.length + 1}`,
          autoRunCommand: 'claude',
        }
      );

      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Failed to create session');
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      await window.electron.ipcRenderer.invoke(
        'session:updateLastAccessed',
        repositoryId,
        sessionId
      );
    } catch (err) {
      console.error('Failed to update last accessed:', err);
    }
  };

  const handleSessionClose = async (sessionId: string) => {
    if (sessions.length === 1) {
      return; // Don't close last session
    }

    try {
      await window.electron.ipcRenderer.invoke(
        'session:delete',
        repositoryId,
        sessionId
      );

      const newSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(newSessions);

      if (activeSessionId === sessionId && newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session');
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      const updated = await window.electron.ipcRenderer.invoke(
        'session:update',
        repositoryId,
        sessionId,
        { title: newTitle }
      );

      setSessions(sessions.map((s) => (s.id === sessionId ? updated : s)));
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent text-text-primary">
        <div className="text-2xl">Loading repository...</div>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent text-text-primary">
        <div className="text-2xl mb-4">{error || 'Repository not found'}</div>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-surface-raised hover:bg-surface-elevated rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-text-primary">
      {/* Left Sidebar */}
      <Sidebar
        repository={repository}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionClose={handleSessionClose}
        onCreateSession={handleCreateSession}
        onRenameSession={handleRenameSession}
        onGoHome={handleGoHome}
      />

      {/* Center: Terminal */}
      <div className="flex-1 flex flex-col">
        {activeSessionId ? (
          <Terminal
            key={activeSessionId}
            sessionId={activeSessionId}
            repositoryId={repositoryId!}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center">
              <p className="text-xl mb-4">No sessions yet</p>
              <button
                onClick={() => handleCreateSession()}
                className="px-6 py-3 bg-surface-raised hover:bg-surface-elevated rounded-lg transition-colors"
              >
                Create First Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Git Changes */}
      {activeSessionId && (
        <GitSidebar
          repositoryId={repositoryId!}
          sessionId={activeSessionId}
        />
      )}
    </div>
  );
}
