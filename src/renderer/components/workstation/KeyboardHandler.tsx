import React, { useEffect } from 'react';
import { useWorkstationStore } from '../../stores';
import { KEYBOARD_SHORTCUTS } from '../../constants';

interface KeyboardHandlerProps {
  repositoryId: string;
}

function KeyboardHandler({ repositoryId }: KeyboardHandlerProps) {
  const { toggleGitSidebar } = useWorkstationStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle git sidebar with Cmd+] (Mac) or Ctrl+] (Windows/Linux)
      if (
        event.key === KEYBOARD_SHORTCUTS.TOGGLE_GIT_SIDEBAR &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleGitSidebar(repositoryId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleGitSidebar, repositoryId]);

  return null;
}

export default KeyboardHandler