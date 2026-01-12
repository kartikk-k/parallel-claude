import { useEffect } from 'react';
import './App.css';
import { TabBar } from './components/tabs';
import TabContent from './components/TabContent';
import { useTabStore } from './store/tabStore';
import { KEYBOARD_SHORTCUTS } from './constants';

if(process.env.NODE_ENV === 'development') {
  import("react-grab");
}

export default function App() {
  const { tabs, activeTabId, setActiveTab } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    // Listen for navigation requests from main process
    const unsubscribe = window.electron?.ipcRenderer.on('navigate-to', (...args: unknown[]) => {
      const route = args[0] as string;

      // Find or create tab for this route
      if (route === '/') {
        const dashboardTab = tabs.find((t) => t.type === 'dashboard');
        if (dashboardTab) {
          setActiveTab(dashboardTab.id);
        }
      } else if (route.startsWith('/repository/')) {
        const repoId = route.split('/')[2];
        const existingTab = tabs.find((t) => t.repository?.id === repoId);
        if (existingTab) {
          setActiveTab(existingTab.id);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [tabs, setActiveTab]);

  useEffect(() => {
    // Handle keyboard shortcuts for tab navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      // Option + Cmd + Arrow Left/Right (Mac) or Alt + Ctrl + Arrow Left/Right (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.altKey) {
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);

        if (event.key === KEYBOARD_SHORTCUTS.PREV_TAB) {
          // Move to previous tab (don't loop)
          if (currentIndex > 0) {
            event.preventDefault();
            setActiveTab(tabs[currentIndex - 1].id);
          }
        } else if (event.key === KEYBOARD_SHORTCUTS.NEXT_TAB) {
          // Move to next tab (don't loop)
          if (currentIndex < tabs.length - 1) {
            event.preventDefault();
            setActiveTab(tabs[currentIndex + 1].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, setActiveTab]);

  return (
    <div className="flex flex-col h-screen">
      {/* Global invisible draggable bar at the top */}
      <div className="fixed top-0 left-0 right-0 h-3 draggable-region z-50 pointer-events-none" />

      {/* Tab Bar */}
      <TabBar />

      {/* Content Area - Render all tabs but only show the active one */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.map((tab) => (
          <TabContent
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
          />
        ))}
      </div>
    </div>
  );
}
