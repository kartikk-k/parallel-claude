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
    <div className="px-4 py-3 border-b border-white/10">
      {repository ? (
        <div>
          <h2 className="text-sm font-medium text-white/90 truncate">{repository.name}</h2>
          <p className="text-xs text-white/40 truncate font-mono">{repository.sourcePath}</p>
        </div>
      ) : (
        <h2 className="text-sm font-medium text-white/90">Terminal</h2>
      )}
    </div>
  );
}
