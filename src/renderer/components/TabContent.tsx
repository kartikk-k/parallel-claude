import { memo } from 'react';
import Dashboard from './dashboard';
import Workstation from './workstation';
import type { Tab } from '../store/tabStore';

interface TabContentProps {
  tab: Tab;
  isActive: boolean;
}

// Memoized component to prevent re-rendering when not active
const TabContent = memo(({ tab, isActive }: TabContentProps) => {
  return (
    <div
      className={`absolute inset-0 flex-1 transition-opacity duration-150 ${
        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
      }`}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        userSelect: isActive ? 'auto' : 'none',
      }}
      inert={!isActive ? true : undefined}
    >
      {tab.type === 'dashboard' && <Dashboard />}
      {tab.type === 'repository' && tab.repository && (
        <Workstation repository={tab.repository} isActive={isActive} />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if tab changes or isActive state changes
  // This prevents unnecessary re-renders when switching between other tabs
  if (prevProps.tab.id !== nextProps.tab.id) return false;
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true; // Skip re-render if nothing changed
});

TabContent.displayName = 'TabContent';

export default TabContent;
