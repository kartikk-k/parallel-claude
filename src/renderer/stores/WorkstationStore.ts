import { create } from 'zustand';

interface WorkstationState {
  isGitSidebarVisible: boolean;
  toggleGitSidebar: () => void;
  setGitSidebarVisible: (visible: boolean) => void;
}

export const useWorkstationStore = create<WorkstationState>((set) => ({
  isGitSidebarVisible: true,
  toggleGitSidebar: () => set((state) => ({ isGitSidebarVisible: !state.isGitSidebarVisible })),
  setGitSidebarVisible: (visible: boolean) => set({ isGitSidebarVisible: visible }),
}));
