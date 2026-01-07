import React from 'react';
import { useWorkstationStore } from '../../stores';

interface TopbarProps {
  repositoryId: string;
}

function Topbar({ repositoryId }: TopbarProps) {
  const { isGitSidebarVisible, toggleGitSidebar } = useWorkstationStore();
  const sidebarVisible = isGitSidebarVisible(repositoryId);

  return (
    <div className='h-[42px] flex items-center justify-end px-4'>
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
  );
}

export default Topbar;