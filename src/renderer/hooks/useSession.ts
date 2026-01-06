import { useState, useCallback } from 'react';
import { SessionMetadata } from '../types';

interface CreateSessionOptions {
  title?: string;
  autoRunCommand?: string;
}

export function useSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (repositoryId: string, options?: CreateSessionOptions): Promise<SessionMetadata> => {
      try {
        setLoading(true);
        setError(null);
        const session = await window.electron.ipcRenderer.invoke(
          'session:create',
          repositoryId,
          options
        );
        return session;
      } catch (err) {
        console.error('Failed to create session:', err);
        setError('Failed to create session');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getByRepository = useCallback(async (repositoryId: string): Promise<SessionMetadata[]> => {
    try {
      setLoading(true);
      setError(null);
      const sessions = await window.electron.ipcRenderer.invoke(
        'session:getByRepository',
        repositoryId
      );
      return sessions;
    } catch (err) {
      console.error('Failed to get sessions:', err);
      setError('Failed to load sessions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(
    async (
      repositoryId: string,
      sessionId: string,
      updates: Partial<SessionMetadata>
    ): Promise<SessionMetadata> => {
      try {
        setLoading(true);
        setError(null);
        const session = await window.electron.ipcRenderer.invoke(
          'session:update',
          repositoryId,
          sessionId,
          updates
        );
        return session;
      } catch (err) {
        console.error('Failed to update session:', err);
        setError('Failed to update session');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const remove = useCallback(async (repositoryId: string, sessionId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await window.electron.ipcRenderer.invoke('session:delete', repositoryId, sessionId);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLastAccessed = useCallback(
    async (repositoryId: string, sessionId: string): Promise<void> => {
      try {
        await window.electron.ipcRenderer.invoke(
          'session:updateLastAccessed',
          repositoryId,
          sessionId
        );
      } catch (err) {
        console.error('Failed to update last accessed:', err);
      }
    },
    []
  );

  return {
    create,
    getByRepository,
    update,
    remove,
    updateLastAccessed,
    loading,
    error,
  };
}
