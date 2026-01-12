import { Repository } from '../../../types';

interface SidebarHeaderProps {
  repository?: Repository;
}

export default function SidebarHeader({ repository }: SidebarHeaderProps) {
  const handleOpenPath = async () => {
    if (repository?.sourcePath) {
      try {
        await window.electron.ipcRenderer.invoke('shell:openPath', repository.sourcePath);
      } catch (err) {
        console.error('Failed to open path:', err);
      }
    }
  };

  return (
    <div className="px-4 py-3 border-b border-white/10">
      {repository ? (
        <div>
          <h2 className="text-sm font-medium text-white/90 truncate">{repository.name}</h2>
          <p
            onClick={handleOpenPath}
            className="text-xs text-white/40 truncate font-mono cursor-pointer hover:text-white/60 transition-colors"
            title="Click to open in Finder"
          >
            {repository.sourcePath}
          </p>
        </div>
      ) : (
        <h2 className="text-sm font-medium text-white/90">Terminal</h2>
      )}
    </div>
  );
}
