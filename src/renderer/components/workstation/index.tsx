import { useState, useEffect, useCallback } from 'react';
import Sidebar from './sidebar';
import Terminal from './terminal/Terminal';
import Topbar from './Topbar';
import GitSidebar from './git-sidebar';
import KeyboardHandler from './KeyboardHandler';
import { useWorkstationStore } from '../../stores';
import { Repository, SessionMetadata } from '../../types';
import { useTabStore } from '../../store/tabStore';

interface WorkstationProps {
  repository: Repository;
  isActive?: boolean;
}

export default function Workstation({ repository, isActive = true }: WorkstationProps) {
  const { isGitSidebarVisible } = useWorkstationStore();
  const { setActiveTab } = useTabStore();

  const repositoryId = repository.id;
  const gitSidebarVisible = isGitSidebarVisible(repositoryId);

  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionsList = await window.electron.ipcRenderer.invoke(
        'session:getByRepository',
        repositoryId
      );

      setSessions(sessionsList);

      // Set active session to first one if exists
      if (sessionsList.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [repositoryId, activeSessionId]);

  useEffect(() => {
    // Only load sessions once on mount
    if (!isInitialized) {
      loadSessions();
      setIsInitialized(true);
    }
  }, [repositoryId, isInitialized, loadSessions]);

  const handleCreateSession = useCallback(async (title?: string) => {
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
  }, [repositoryId, sessions]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
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
  }, [repositoryId]);

  const handleSessionClose = useCallback(async (sessionId: string) => {
    if (sessions.length === 1) {
      return; // Don't close last session
    }

    try {
      // Explicitly destroy the terminal process
      window.electron?.ipcRenderer.sendMessage('terminal-destroy', sessionId);

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
  }, [sessions, repositoryId, activeSessionId]);

  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
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
  }, [repositoryId, sessions]);

  const handleGoHome = useCallback(async () => {
    // Switch to dashboard tab
    const tabs = useTabStore.getState().tabs;
    const dashboardTab = tabs.find((t) => t.type === 'dashboard');
    if (dashboardTab) {
      setActiveTab(dashboardTab.id);
    }
  }, [setActiveTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent text-white">
        <div className="text-2xl">Loading repository...</div>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent text-white">
        <div className="text-2xl mb-4">{error || 'Repository not found'}</div>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <>
    <KeyboardHandler repositoryId={repositoryId} />
    <div className="flex h-full text-white">
      {/* Left Sidebar */}
      <div className='p-1.5 pr-0'>
        <div className='bg-neutral-800/40 h-full rounded-lg'>
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
        </div>
        </div>

      {/* Center: Terminal */}
      <div className='p-1.5 flex-1 w-full'>
      <div className="flex-1 flex flex-col h-full bg-neutral-800/40 rounded-lg overflow-hidden">
        {/* top bar */}
        <div className='border-b border-white/20'>
        <Topbar repositoryId={repositoryId} />
        </div>
        <div className='bg- neutral-900/80 flex-1 relative'>
        {sessions.length > 0 ? (
          // Render all terminals but only show the active one
          sessions.map((session) => (
            <div
              key={session.id}
              className="absolute inset-0"
              style={{
                visibility: session.id === activeSessionId ? 'visible' : 'hidden',
                zIndex: session.id === activeSessionId ? 1 : 0,
              }}
            >
              <Terminal
                sessionId={session.id}
                repositoryId={repositoryId!}
                isActive={session.id === activeSessionId}
              />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <p className="text-xl mb-4">No sessions yet</p>
              <button
                onClick={() => handleCreateSession()}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                Create First Session
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>


      {/* Right Sidebar: Git Changes */}
      {activeSessionId && gitSidebarVisible && (
        <div className='p-1.5 pl-0 w-80 flex flex-col overflow-hidden'>
        <div className='bg-neutral-800/40 rounded-lg flex-1 overflow-hidden'>
        <GitSidebar
          repositoryId={repositoryId}
          sessionId={activeSessionId}
          />
          </div>
          </div>
      )}
    </div>
    </>
  );
}
