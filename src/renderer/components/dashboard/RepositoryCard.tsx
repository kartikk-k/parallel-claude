import { Repository } from '../../types';

interface RepositoryCardProps {
  repository: Repository;
  onClick: () => void;
  formatDate: (dateString: string) => string;
}

export default function RepositoryCard({ repository, onClick, formatDate }: RepositoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl transition-all text-left group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 opacity-50" x="0px" y="0px" width="12px" height="12px" viewBox="0 0 12 12"><path d="m2.75,2.75h2.864l-.298-.636c-.247-.527-.776-.864-1.358-.864h-1.708c-.828,0-1.5.672-1.5,1.5v2c0-1.105.895-2,2-2Z" fill="rgba(255, 255, 255, 1)" stroke-width="0" data-color="color-2"></path><path d="m.75,4.75v-2c0-.828.672-1.5,1.5-1.5h1.708c.582,0,1.111.337,1.358.864l.298.636" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" data-color="color-2"></path><path d="m2.75,2.75h6.5c1.105,0,2,.895,2,2v3.5c0,1.105-.895,2-2,2H2.75c-1.105,0-2-.895-2-2v-3.5c0-1.105.895-2,2-2Z" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base text-white/90 truncate">{repository.name}</h3>
          <p className="text-xs text-white/40 truncate font-mono">{repository.sourcePath}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
          </svg>
          <span className="text-xs text-white/50 font-medium">
            {repository.sessionIds.length} session{repository.sessionIds.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-white/50 font-mono">{repository.defaultBranch}</span>
        </div>

        {repository.gitRemote && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-xs text-white/50 font-mono truncate">{repository.gitRemote}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-white/40">{formatDate(repository.lastAccessedAt)}</span>
        </div>
      </div>
    </button>
  );
}
