import { create } from 'zustand';

interface WorkstationState {
  gitSidebarVisibility: Record<string, boolean>; // Track per repository ID
  isGitSidebarVisible: (repositoryId: string) => boolean;
  toggleGitSidebar: (repositoryId: string) => void;
  setGitSidebarVisible: (repositoryId: string, visible: boolean) => void;
}

export const useWorkstationStore = create<WorkstationState>((set, get) => ({
  gitSidebarVisibility: {},

  isGitSidebarVisible: (repositoryId: string) => {
    const visibility = get().gitSidebarVisibility[repositoryId];
    return visibility !== undefined ? visibility : false; // Default to visible
  },

  toggleGitSidebar: (repositoryId: string) => set((state) => ({
    gitSidebarVisibility: {
      ...state.gitSidebarVisibility,
      [repositoryId]: !state.isGitSidebarVisible(repositoryId),
    },
  })),

  setGitSidebarVisible: (repositoryId: string, visible: boolean) => set((state) => ({
    gitSidebarVisibility: {
      ...state.gitSidebarVisibility,
      [repositoryId]: visible,
    },
  })),
}));
