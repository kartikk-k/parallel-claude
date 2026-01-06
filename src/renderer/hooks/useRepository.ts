import { useState, useCallback } from 'react';
import { Repository } from '../types';

export function useRepository() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAll = useCallback(async (): Promise<Repository[]> => {
    try {
      setLoading(true);
      setError(null);
      const repos = await window.electron.ipcRenderer.invoke('repository:getAll');
      return repos;
    } catch (err) {
      console.error('Failed to get all repositories:', err);
      setError('Failed to load repositories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecent = useCallback(async (): Promise<Repository[]> => {
    try {
      setLoading(true);
      setError(null);
      const repos = await window.electron.ipcRenderer.invoke('repository:getRecent');
      return repos;
    } catch (err) {
      console.error('Failed to get recent repositories:', err);
      setError('Failed to load recent repositories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: string): Promise<Repository | null> => {
    try {
      setLoading(true);
      setError(null);
      const repo = await window.electron.ipcRenderer.invoke('repository:get', id);
      return repo;
    } catch (err) {
      console.error('Failed to get repository:', err);
      setError('Failed to load repository');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await window.electron.ipcRenderer.invoke('repository:remove', id);
    } catch (err) {
      console.error('Failed to remove repository:', err);
      setError('Failed to remove repository');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getAll,
    getRecent,
    getById,
    remove,
    loading,
    error,
  };
}
