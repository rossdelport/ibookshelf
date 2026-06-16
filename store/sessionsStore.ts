import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadingSession } from '../types/book';
import { pushSession, removeSession as removeSessionRemote } from '../lib/sync';

export type { ReadingSession };

interface SessionsState {
  sessions: ReadingSession[]; // newest first
  addSession: (s: Omit<ReadingSession, 'id'>) => void;
  removeSession: (id: string) => void;
  hydrate: (sessions: ReadingSession[]) => void;
  clear: () => void;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (s) => {
        const session: ReadingSession = { ...s, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
        set((st) => ({ sessions: [session, ...st.sessions] }));
        pushSession(session); // no-op when signed out
      },
      removeSession: (id) => {
        set((st) => ({ sessions: st.sessions.filter((x) => x.id !== id) }));
        removeSessionRemote(id);
      },
      // Replace local sessions from a remote pull (no push-back).
      hydrate: (sessions) => set({ sessions }),
      clear: () => set({ sessions: [] }),
    }),
    {
      name: 'ibookshelf-sessions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (st) => ({ sessions: st.sessions }),
    },
  ),
);
