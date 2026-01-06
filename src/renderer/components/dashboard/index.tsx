import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import SearchBar from './SearchBar';
import ErrorAlert from './ErrorAlert';
import RepositoryDropZone from './RepositoryDropZone';
import RepositoryGrid from './RepositoryGrid';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import { Repository } from '../../types';
import { formatDate } from '../../utils';
import { getWorkstationRoute } from '../../constants';

export default function Dashboard() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [recentRepositories, setRecentRepositories] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
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
  };

  const handleSelectRepository = async () => {
    try {
      setError(null);
      const repository = await window.electron.ipcRenderer.invoke('repository:select');
      if (repository) {
        // Open in new window or focus existing
        await window.electron.ipcRenderer.invoke('window:open-repository', repository.id);
      }
    } catch (err: any) {
      console.error('Failed to select repository:', err);
      setError(err.message || 'This folder is not a Git repository');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDropRepository = async (path: string) => {
    try {
      setError(null);
      const repository = await window.electron.ipcRenderer.invoke('repository:select', path);
      if (repository) {
        // Open in new window or focus existing
        await window.electron.ipcRenderer.invoke('window:open-repository', repository.id);
      }
    } catch (err: any) {
      console.error('Failed to add repository:', err);
      setError(err.message || 'This folder is not a Git repository');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenRepository = async (repository: Repository) => {
    try {
      await window.electron.ipcRenderer.invoke('repository:updateLastAccessed', repository.id);
      // Open in new window or focus existing
      await window.electron.ipcRenderer.invoke('window:open-repository', repository.id);
    } catch (err) {
      console.error('Failed to open repository:', err);
    }
  };

  const handleDeleteRepository = async (repository: Repository) => {
    try {
      await window.electron.ipcRenderer.invoke('repository:delete', repository.id);
      // Reload repositories after deletion
      await loadRepositories();
    } catch (err) {
      console.error('Failed to delete repository:', err);
      setError('Failed to delete repository');
      setTimeout(() => setError(null), 5000);
    }
  };

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
    <div className="min-h-screen bg-transparent text-white p-8">
      <div className="max-w-5xl mx-auto">
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
