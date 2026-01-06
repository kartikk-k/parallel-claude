import React, { useEffect } from 'react';
import { useWorkstationStore } from '../../stores';
import { KEYBOARD_SHORTCUTS } from '../../constants';

function KeyboardHandler() {
  const { toggleGitSidebar } = useWorkstationStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle git sidebar
      if (event.key === KEYBOARD_SHORTCUTS.TOGGLE_GIT_SIDEBAR) {
        event.preventDefault();
        toggleGitSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleGitSidebar]);

  return null;
}

export default KeyboardHandler