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
        group flex items-center gap-1 px-2 h-[32px] max-w-[200px] cursor-pointer rounded-md
        ${isDashboard ? 'min-w-0' : 'min-w-[120px]'}
        transition-all
        ${isActive
          ? 'bg-white/20 text-white'
          : 'text-white/60 hover:bg-white/8 hover:text-white/80'
        }
      `}
    >
      {/* Tab icon */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {isDashboard ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><g fill="currentColor"><path d="M13.75 6.019C13.336 6.019 13 5.683 13 5.269V2.75C13 2.336 13.336 2 13.75 2C14.164 2 14.5 2.336 14.5 2.75V5.269C14.5 5.683 14.164 6.019 13.75 6.019Z" fill="currentColor"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.792 5.848L9.446 1.147C9.181 0.951 8.818 0.951 8.553 1.147L2.208 5.848C1.764 6.177 1.5 6.702 1.5 7.254V13.75C1.5 15.267 2.733 16.5 4.25 16.5H5.5V12.75C5.5 11.7835 6.2835 11 7.25 11C8.2165 11 9 11.7835 9 12.75V16.5H13.75C15.267 16.5 16.5 15.267 16.5 13.75V7.254C16.5 6.702 16.235 6.176 15.792 5.848ZM11.25 10.5H12.75C13.164 10.5 13.5 10.164 13.5 9.75C13.5 9.336 13.164 9 12.75 9H11.25C10.836 9 10.5 9.336 10.5 9.75C10.5 10.164 10.836 10.5 11.25 10.5Z" fill="currentColor"></path></g></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className='size-3 opacity-60' width="12" height="12" viewBox="0 0 12 12"><g fill="currentColor"><path d="m1,5c0-1.105.895-2,2-2h3.48c-.076-.267-.145-.479-.187-.568l-.298-.637c-.369-.787-1.168-1.295-2.038-1.295h-1.708C1.009.5,0,1.509,0,2.75v2c0,.414.336.75.75.75.063,0,.152.04.25.094v-.594Z" stroke-width="0"></path><path d="m9.25,11H2.75c-1.517,0-2.75-1.233-2.75-2.75v-3.5c0-1.517,1.233-2.75,2.75-2.75h6.5c1.517,0,2.75,1.233,2.75,2.75v3.5c0,1.517-1.233,2.75-2.75,2.75ZM2.75,3.5c-.689,0-1.25.561-1.25,1.25v3.5c0,.689.561,1.25,1.25,1.25h6.5c.689,0,1.25-.561,1.25-1.25v-3.5c0-.689-.561-1.25-1.25-1.25H2.75Z" stroke-width="0"></path></g></svg>
        )}
      </div>

      {/* Tab title */}
      {!isDashboard && (
        <span className="flex-1 truncate text-[13px] relative mb-px">
        {tab.title}
      </span>
      )}

      {/* Close button */}
      {!isDashboard && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 w-4 h-4 rounded flex items-center justify-center
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className='size-2.5 opacity-30 group-hover:opacity-50' width="12" height="12" viewBox="0 0 12 12"><g fill="currentColor"><path d="m2.25,10.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L9.22,1.72c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-7.5,7.5c-.146.146-.338.22-.53.22Z" stroke-width="0"></path><path d="m9.75,10.5c-.192,0-.384-.073-.53-.22L1.72,2.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l7.5,7.5c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z" stroke-width="0"></path></g></svg>  
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
