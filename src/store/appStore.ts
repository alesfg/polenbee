import { create } from 'zustand';
import { PollenHistoryEntry, POLLEN_HISTORY } from '@/data/mockData';

interface AppStore {
  pollenHistory: PollenHistoryEntry[];
  addPollenHistory: (entry: PollenHistoryEntry) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  pollenHistory: POLLEN_HISTORY,
  addPollenHistory: (entry) =>
    set((state) => ({ pollenHistory: [entry, ...state.pollenHistory] })),
}));
