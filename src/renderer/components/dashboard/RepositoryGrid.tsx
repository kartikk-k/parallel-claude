import { memo } from 'react';
import RepositoryCard from './RepositoryCard';

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

interface RepositoryGridProps {
  title: string;
  repositories: Repository[];
  onRepositoryClick: (repository: Repository) => void;
  onRepositoryDelete?: (repository: Repository) => void;
  formatDate: (dateString: string) => string;
  emptyMessage?: string;
}

const RepositoryGrid = memo(({
  title,
  repositories,
  onRepositoryClick,
  onRepositoryDelete,
  formatDate,
  emptyMessage = 'No projects found',
}: RepositoryGridProps) => (
  <div className="">
    <h2 className="text-xl font-medium mb-4 text-white/80">{title}</h2>
    {repositories.length === 0 ? (
      <div className="text-center py-12 text-white/50">
        {emptyMessage}
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {repositories.map((repo) => (
          <RepositoryCard
            key={repo.id}
            repository={repo}
            onClick={() => onRepositoryClick(repo)}
            onDelete={onRepositoryDelete}
            formatDate={formatDate}
          />
        ))}
      </div>
    )}
  </div>
));

RepositoryGrid.displayName = 'RepositoryGrid';

export default RepositoryGrid;
