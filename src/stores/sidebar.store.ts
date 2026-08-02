import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  toggleCollapsed: () => void;
  setMobile: (isMobile: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isCollapsed: false,
  isMobile: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setMobile: (isMobile) =>
    set({
      isMobile,
      isOpen: !isMobile,
      isCollapsed: false,
    }),
}));
