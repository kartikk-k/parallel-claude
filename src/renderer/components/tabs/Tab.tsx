import { memo, useCallback } from 'react';
import { useTabStore, type Tab as TabType } from '../../store/tabStore';

interface TabProps {
  tab: TabType;
  isActive: boolean;
}

const Tab = memo(({ tab, isActive }: TabProps) => {
  const { setActiveTab, removeTab } = useTabStore();
  const isDashboard = tab.type === 'dashboard';

  const handleClick = useCallback(() => {
    setActiveTab(tab.id);
  }, [tab.id, setActiveTab]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDashboard) {
      removeTab(tab.id);
    }
  }, [isDashboard, tab.id, removeTab]);

  const handleContextMenu = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems = [];

    if (!isDashboard) {
      menuItems.push(
        { label: 'Open in New Window', action: 'open-window' },
        { label: 'Close Tab', action: 'close' },
        { label: 'Close Other Tabs', action: 'close-others' },
        { label: 'Close Tabs to the Right', action: 'close-right' }
      );
    }

    if (menuItems.length === 0) return;

    try {
      const result = await window.electron.ipcRenderer.invoke('show-context-menu', menuItems);

      if (result === 'close') {
        removeTab(tab.id);
      } else if (result === 'close-others') {
        useTabStore.getState().closeOtherTabs(tab.id);
      } else if (result === 'close-right') {
        useTabStore.getState().closeTabsToRight(tab.id);
      } else if (result === 'open-window' && tab.repository) {
        // Open in new window
        await window.electron.ipcRenderer.invoke('window:open-repository', tab.repository.id);
      }
    } catch (err) {
      console.error('Tab context menu error:', err);
    }
  }, [isDashboard, tab, removeTab]);

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`
        group flex items-center gap-2 px-4 py-2 min-w-[120px] max-w-[200px] cursor-pointer
        border-r border-white/5 transition-all
        ${isActive
          ? 'bg-white/10 text-white'
          : 'bg-white/5 text-white/60 hover:bg-white/8 hover:text-white/80'
        }
      `}
    >
      {/* Tab icon */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {isDashboard ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
      </div>

      {/* Tab title */}
      <span className="flex-1 truncate text-sm font-medium">
        {tab.title}
      </span>

      {/* Close button */}
      {!isDashboard && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 w-4 h-4 rounded flex items-center justify-center
            transition-all opacity-0 group-hover:opacity-100
            hover:bg-white/20
            ${isActive ? 'opacity-100' : ''}
          `}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if tab id or isActive state changes
  return prevProps.tab.id === nextProps.tab.id &&
         prevProps.isActive === nextProps.isActive &&
         prevProps.tab.title === nextProps.tab.title;
});

Tab.displayName = 'Tab';

export default Tab;
