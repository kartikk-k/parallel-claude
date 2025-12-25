interface SidebarNavigationProps {
  onCreateSession: () => void;
  onGoHome?: () => void;
}

export default function SidebarNavigation({ onCreateSession, onGoHome }: SidebarNavigationProps) {
  return (
    <div className="px-2 py-3 border-b border-white/10">
      <button
        onClick={() => onCreateSession()}
        className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 rounded-md transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">New Session</span>
      </button>

      {onGoHome && (
        <button
          onClick={onGoHome}
          className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 rounded-md transition-colors mt-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="font-medium">All Repositories</span>
        </button>
      )}
    </div>
  );
}
