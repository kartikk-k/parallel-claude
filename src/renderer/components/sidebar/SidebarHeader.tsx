interface Repository {
  id: string;
  name: string;
  sourcePath: string;
  defaultBranch?: string;
}

interface SidebarHeaderProps {
  repository?: Repository;
}

export default function SidebarHeader({ repository }: SidebarHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border">
      {repository ? (
        <div>
          <h2 className="text-sm font-medium text-text-primary truncate">{repository.name}</h2>
          <p className="text-xs text-text-muted truncate font-mono">{repository.sourcePath}</p>
        </div>
      ) : (
        <h2 className="text-sm font-medium text-text-primary">Terminal</h2>
      )}
    </div>
  );
}
