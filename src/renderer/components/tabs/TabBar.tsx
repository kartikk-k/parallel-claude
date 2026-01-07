import { memo } from 'react';
import { useTabStore } from '../../store/tabStore';
import Tab from './Tab';

const TabBar = memo(() => {
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);

  return (
    <div className="flex items-center bg-black/20 backdrop-blur-sm border-b border-white/5 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <Tab key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
      ))}
    </div>
  );
});

TabBar.displayName = 'TabBar';

export default TabBar;
