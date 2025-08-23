import { create } from 'zustand';

export type TabType = 'trading' | 'poker' | 'polymarket';

interface AppStore {
  // Local UI state only - persistent settings moved to Convex
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
}

export const useAppStore = create<AppStore>()(
  (set) => ({
    leftSidebarCollapsed: false,
    rightSidebarCollapsed: false,

    toggleLeftSidebar: () => {
      set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }));
    },

    toggleRightSidebar: () => {
      set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed }));
    },
  })
);
