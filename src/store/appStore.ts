import { create } from 'zustand';
import type { FilterState } from '../../shared/types';

const today = new Date();
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(today.getMonth() - 3);

interface AppStore {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  aircraftType: null,
  base: null,
  ataChapter: null,
  season: null,
  faultCode: null,
  dateRange: {
    start: threeMonthsAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  },
};

export const useAppStore = create<AppStore>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: initialFilters }),
}));
