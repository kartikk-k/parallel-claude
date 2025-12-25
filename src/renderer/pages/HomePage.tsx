import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Repository {
  id: string;
  name: string;
  slug: string;
  sourcePath: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  sessionIds: string[];
  defaultBranch: string;
  gitRemote?: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [recentRepositories, setRecentRepositories] = useState<Repository[]>([]);
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
        // Navigate to repository view
        navigate(`/repository/${repository.id}`);
      }
    } catch (err: any) {
      console.error('Failed to select repository:', err);
      setError(err.message || 'Failed to select repository');
    }
  };

  const handleOpenRepository = async (repository: Repository) => {
    try {
      await window.electron.ipcRenderer.invoke('repository:updateLastAccessed', repository.id);
      navigate(`/repository/${repository.id}`);
    } catch (err) {
      console.error('Failed to open repository:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent text-white">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">ParallelClaude</h1>
          <p className="text-xl text-white/70">
            Run multiple Claude agents in parallel
          </p>
          <p className="text-white/50 mt-2">
            Each session = isolated Git branch
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Select Repository Button */}
        <div className="mb-12">
          <button
            onClick={handleSelectRepository}
            className="w-full p-6 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl transition-all flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Select Git Repository
          </button>
        </div>

        {/* Recent Repositories */}
        {recentRepositories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Recent Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRepositories.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleOpenRepository(repo)}
                  className="p-6 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-xl transition-all text-left"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{repo.name}</h3>
                      <p className="text-sm text-white/60 truncate">{repo.sourcePath}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>{repo.sessionIds.length} session{repo.sessionIds.length !== 1 ? 's' : ''}</span>
                    <span>{formatDate(repo.lastAccessedAt)}</span>
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    {repo.defaultBranch}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Repositories */}
        {repositories.length > 0 && repositories.length > recentRepositories.length && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">All Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories
                .filter(repo => !recentRepositories.find(r => r.id === repo.id))
                .map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleOpenRepository(repo)}
                    className="p-6 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl transition-all text-left"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{repo.name}</h3>
                        <p className="text-sm text-white/60 truncate">{repo.sourcePath}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{repo.sessionIds.length} session{repo.sessionIds.length !== 1 ? 's' : ''}</span>
                      <span>{formatDate(repo.lastAccessedAt)}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {repositories.length === 0 && !isLoading && (
          <div className="text-center py-12 text-white/50">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-lg">No repositories yet</p>
            <p className="text-sm mt-2">Select a Git repository to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
