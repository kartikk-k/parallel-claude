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
  formatDate: (dateString: string) => string;
  emptyMessage?: string;
}

export default function RepositoryGrid({
  title,
  repositories,
  onRepositoryClick,
  formatDate,
  emptyMessage = 'No projects found',
}: RepositoryGridProps) {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-medium mb-4 text-white/80">{title}</h2>
      {repositories.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onClick={() => onRepositoryClick(repo)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
