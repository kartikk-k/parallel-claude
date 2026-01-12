interface SidebarNavigationProps {
  onCreateSession: () => void;
  onGoHome?: () => void;
  isCreatingSession?: boolean;
}

export default function SidebarNavigation({ onCreateSession, onGoHome, isCreatingSession }: SidebarNavigationProps) {
  return (
    <div className="px-2 py-3 border-b border-white/10">
      <button
        onClick={() => onCreateSession()}
        disabled={isCreatingSession}
        className={`w-full px-3 py-2 flex items-center gap-3 text-sm rounded-md transition-colors ${
          isCreatingSession
            ? 'text-white/40 bg-white/5 cursor-wait'
            : 'text-white/70 hover:text-white/90 hover:bg-white/10'
        }`}
      >
        <svg className="size-4" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="18px" height="18px" viewBox="0 0 18 18"><path d="M14.75 12.25V17.25" stroke="rgba(255, 255, 255, 1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-color="color-2" fill="none"></path>
<path d="M16.2155 9.64111C16.2364 9.42991 16.25 9.2168 16.25 9C16.25 4.9961 13.004 1.75 9 1.75C4.996 1.75 1.75 4.9961 1.75 9C1.75 10.3188 2.10801 11.552 2.72301 12.6169C3.15301 13.4228 2.67 15.3291 1.75 16.25C3 16.3179 4.647 15.7529 5.383 15.2769C5.872 15.5591 6.647 15.9331 7.662 16.125C8.095 16.207 8.543 16.25 9 16.25C9.2167 16.25 9.4299 16.2363 9.6412 16.2156" stroke="rgba(255, 255, 255, 1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
<path d="M17.25 14.75H12.25" stroke="rgba(255, 255, 255, 1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-color="color-2" fill="none"></path></svg>
        <span className="font-medium">New Session</span>
      </button>

      {onGoHome && (
        <button
          onClick={onGoHome}
          className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 rounded-md transition-colors mt-1"
        >
<svg className="size-4" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="18px" height="18px" viewBox="0 0 18 18"><line x1="9" y1="16" x2="9" y2="12.75" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" data-color="color-2"></line><path d="M14.25,8.75v5.5c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2v-5.5" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><polyline points="2 7 9 1.75 16 7" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></polyline></svg>
          <span className="font-medium">All Repositories</span>
        </button>
      )}
    </div>
  );
}
