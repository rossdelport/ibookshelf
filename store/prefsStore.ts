import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lightweight UI preferences that should survive app restarts (not user data,
// so it stays out of the synced stores). Currently the Shelf tab's layout.

export type ShelfView = 'grid' | 'list';
export type ShelfSort = 'recent' | 'title' | 'author';

interface PrefsState {
  shelfView: ShelfView;
  shelfSort: ShelfSort;
  setShelfView: (view: ShelfView) => void;
  setShelfSort: (sort: ShelfSort) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      shelfView: 'grid',
      shelfSort: 'recent',
      setShelfView: (shelfView) => set({ shelfView }),
      setShelfSort: (shelfSort) => set({ shelfSort }),
    }),
    {
      name: 'ibookshelf-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      // Re-base persisted prefs on the defaults so a value added later can't
      // arrive undefined (same shallow-merge guard as the other stores).
      merge: (persisted, current) => ({ ...current, ...((persisted ?? {}) as Partial<PrefsState>) }),
    },
  ),
);
