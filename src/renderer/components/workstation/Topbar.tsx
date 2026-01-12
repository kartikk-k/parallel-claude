import React, { useState } from 'react';
import { useWorkstationStore } from '../../stores';
import SessionSettings from './SessionSettings';

interface TopbarProps {
  repositoryId: string;
  activeView: 'terminal' | 'preview';
  onViewChange: (view: 'terminal' | 'preview') => void;
  activeSessionId: string | null;
  sessionTitle?: string;
  sessionPreviewUrl?: string;
  sessionWorkingDirectory?: string;
  onSettingsSaved?: () => void;
}

function Topbar({
  repositoryId,
  activeView,
  onViewChange,
  activeSessionId,
  sessionTitle = 'Session',
  sessionPreviewUrl,
  sessionWorkingDirectory,
  onSettingsSaved,
}: TopbarProps) {
  const { isGitSidebarVisible, toggleGitSidebar } = useWorkstationStore();
  const sidebarVisible = isGitSidebarVisible(repositoryId);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className='h-[42px] flex items-center justify-between px-4'>
      {/* View Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onViewChange('terminal')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeView === 'terminal'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => onViewChange('preview')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeView === 'preview'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-2">
        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          disabled={!activeSessionId}
          className={`p-2 rounded-lg transition-colors ${
            !activeSessionId
              ? 'bg-transparent text-white/30 cursor-not-allowed'
              : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white/70'
          }`}
          title="Session Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Git Sidebar Toggle */}
        <button
          onClick={() => toggleGitSidebar(repositoryId)}
          className={`p-2 rounded-lg transition-colors ${
            sidebarVisible
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white/70'
          }`}
          title={sidebarVisible ? 'Hide Git Sidebar' : 'Show Git Sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="18px" height="18px" viewBox="0 0 18 18"><line x1="9" y1="8.75" x2="9" y2="12.25" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" data-color="color-2"></line><path d="M4.75,5.75v1c0,1.105,.895,2,2,2h2.25s2.25,0,2.25,0c1.105,0,2-.895,2-2v-1" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" data-color="color-2"></path><circle cx="4.75" cy="3.75" r="2" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle><circle cx="13.25" cy="3.75" r="2" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle><circle cx="9" cy="14.25" r="2" fill="none" stroke="rgba(255, 255, 255, 1)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle></svg>
        </button>
      </div>

      {/* Session Settings Modal */}
      {activeSessionId && (
        <SessionSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          sessionId={activeSessionId}
          repositoryId={repositoryId}
          currentTitle={sessionTitle}
          currentPreviewUrl={sessionPreviewUrl}
          currentWorkingDirectory={sessionWorkingDirectory}
          onSave={onSettingsSaved}
        />
      )}
    </div>
  );
}

export default Topbar;