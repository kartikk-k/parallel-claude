import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from './DashboardHeader';
import SearchBar from './SearchBar';
import ErrorAlert from './ErrorAlert';
import RepositoryDropZone from './RepositoryDropZone';
import RepositoryGrid from './RepositoryGrid';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import { Repository } from '../../types';
import { formatDate } from '../../utils';
import { useTabStore } from '../../store/tabStore';

export default function Dashboard() {
  const { addTab, tabs } = useTabStore();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [recentRepositories, setRecentRepositories] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    try {
      setIsLoading(true);
      const [all, recent] = await Promise.all([
        window.electron.ipcRenderer.invoke('repository:getAll'),
        window.electron.ipcRenderer.invoke('repository:getRecent'),
      ]);
      setRepositories(all);
      setRecentRepositories(recent);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError('Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  const openRepositoryInTab = useCallback((repository: Repository) => {
    // Check if tab already exists
    const existingTab = tabs.find(
      (t) => t.type === 'repository' && t.repository?.id === repository.id
    );

    if (existingTab) {
      // Switch to existing tab
      useTabStore.getState().setActiveTab(existingTab.id);
    } else {
      // Create new tab
      addTab({
        type: 'repository',
        title: repository.name,
        repository,
        route: `/repository/${repository.id}`,
      });
    }
  }, [tabs, addTab]);

  const handleSelectRepository = useCallback(async () => {
    try {
      setError(null);
      const repository = await window.electron.ipcRenderer.invoke('repository:select');
      if (repository) {
        openRepositoryInTab(repository);
      }
    } catch (err: any) {
      console.error('Failed to select repository:', err);
      setError(err.message || 'This folder is not a Git repository');
      setTimeout(() => setError(null), 5000);
    }
  }, [openRepositoryInTab]);

  const handleDropRepository = useCallback(async (path: string) => {
    try {
      setError(null);
      const repository = await window.electron.ipcRenderer.invoke('repository:select', path);
      if (repository) {
        openRepositoryInTab(repository);
      }
    } catch (err: any) {
      console.error('Failed to add repository:', err);
      setError(err.message || 'This folder is not a Git repository');
      setTimeout(() => setError(null), 5000);
    }
  }, [openRepositoryInTab]);

  const handleOpenRepository = useCallback(async (repository: Repository) => {
    try {
      await window.electron.ipcRenderer.invoke('repository:updateLastAccessed', repository.id);
      openRepositoryInTab(repository);
    } catch (err) {
      console.error('Failed to open repository:', err);
    }
  }, [openRepositoryInTab]);

  const handleDeleteRepository = useCallback(async (repository: Repository) => {
    try {
      await window.electron.ipcRenderer.invoke('repository:delete', repository.id);
      // Reload repositories after deletion
      await loadRepositories();
    } catch (err) {
      console.error('Failed to delete repository:', err);
      setError('Failed to delete repository');
      setTimeout(() => setError(null), 5000);
    }
  }, [loadRepositories]);

  const filteredRepositories = repositories.filter(repo => {
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.sourcePath.toLowerCase().includes(query) ||
      repo.slug.toLowerCase().includes(query)
    );
  });

  const allRepositoriesExcludingRecent = filteredRepositories.filter(
    repo => searchQuery || !recentRepositories.find(r => r.id === repo.id)
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="h-full text-white p-1.5 flex flex-col">
      <div className="mx-auto bg-neutral-800/40 p-4 rounded-lg flex-1 w-full h-full overflow-y-auto">
        <DashboardHeader />

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <ErrorAlert message={error} />

        <RepositoryDropZone
          onSelectRepository={handleSelectRepository}
          onDropRepository={handleDropRepository}
        />

        {!searchQuery && recentRepositories.length > 0 && (
          <RepositoryGrid
            title="Recent Repositories"
            repositories={recentRepositories}
            onRepositoryClick={handleOpenRepository}
            onRepositoryDelete={handleDeleteRepository}
            formatDate={formatDate}
          />
        )}

        {(searchQuery || (repositories.length > 0 && repositories.length > recentRepositories.length)) && (
          <RepositoryGrid
            title={searchQuery ? 'Search Results' : 'All Repositories'}
            repositories={allRepositoriesExcludingRecent}
            onRepositoryClick={handleOpenRepository}
            onRepositoryDelete={handleDeleteRepository}
            formatDate={formatDate}
            emptyMessage="No projects found"
          />
        )}

        {repositories.length === 0 && !isLoading && !searchQuery && <EmptyState />}
      </div>
    </div>
  );
}
