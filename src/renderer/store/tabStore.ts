import { create } from 'zustand';
import type { Repository } from '../types';

export interface Tab {
  id: string;
  type: 'dashboard' | 'repository';
  title: string;
  repository?: Repository;
  route: string;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  addTab: (tab: Omit<Tab, 'id'>) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  closeOtherTabs: (tabId: string) => void;
  closeTabsToRight: (tabId: string) => void;
  getTab: (tabId: string) => Tab | undefined;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [
    {
      id: 'dashboard',
      type: 'dashboard',
      title: 'Home',
      route: '/',
    },
  ],
  activeTabId: 'dashboard',

  addTab: (tab) => {
    // Use crypto.randomUUID if available, fallback to timestamp + random
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTab = { ...tab, id };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
    }));

    return id;
  },

  removeTab: (tabId) => {
    const state = get();
    const tabToRemove = state.tabs.find((t) => t.id === tabId);

    // Don't allow closing the dashboard tab
    if (tabToRemove?.type === 'dashboard') {
      return;
    }

    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== tabId);

      // If we're closing the active tab, switch to another tab
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === tabId) {
        const closedIndex = state.tabs.findIndex((t) => t.id === tabId);
        if (closedIndex > 0) {
          // Switch to the tab on the left
          newActiveTabId = tabs[closedIndex - 1]?.id || tabs[0]?.id || null;
        } else {
          // Switch to the first available tab
          newActiveTabId = tabs[0]?.id || null;
        }
      }

      return {
        tabs,
        activeTabId: newActiveTabId,
      };
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  updateTab: (tabId, updates) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }));
  },

  closeOtherTabs: (tabId) => {
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id === tabId || t.type === 'dashboard'),
      activeTabId: tabId,
    }));
  },

  closeTabsToRight: (tabId) => {
    set((state) => {
      const index = state.tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return state;

      return {
        tabs: state.tabs.slice(0, index + 1),
      };
    });
  },

  getTab: (tabId) => {
    return get().tabs.find((t) => t.id === tabId);
  },
}));
