import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { PersonType } from '../types';

interface AppState {
  // Active filters
  activePersonType: PersonType | 'ALL';
  activeMonth: number;
  activeYear: number;

  // UI state
  sidebarOpen: boolean;

  // Actions
  setActivePersonType: (type: PersonType | 'ALL') => void;
  setActivePeriod: (month: number, year: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const now = new Date();

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        activePersonType: 'ALL',
        activeMonth: now.getMonth() + 1,
        activeYear: now.getFullYear(),
        sidebarOpen: true,

        setActivePersonType: (type) => set({ activePersonType: type }),
        setActivePeriod: (month, year) => set({ activeMonth: month, activeYear: year }),
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
      }),
      {
        name: 'financas-app-store',
        partialize: (state) => ({
          activePersonType: state.activePersonType,
          activeMonth: state.activeMonth,
          activeYear: state.activeYear,
        }),
      },
    ),
    { name: 'FinancasStore' },
  ),
);
