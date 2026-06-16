import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRecommendations, tasteSignature, hasEnoughForRecs, type Rec } from '../lib/recommend';

// Holds the current "For you" picks. Persisted so they survive app restarts and
// don't refetch on every open. Regeneration is gated by a taste *signature*
// (loved books + genres) so it only refreshes after a book is finished/rated.
type RecStatus = 'idle' | 'loading' | 'ready' | 'empty';

interface RecsState {
  recs: Rec[];
  status: RecStatus;
  signature: string | null; // the taste signature the current recs were built from
  generate: (force?: boolean) => Promise<void>;
  maybeRefresh: () => void;
  clear: () => void;
}

export const useRecsStore = create<RecsState>()(
  persist(
    (set, get) => ({
      recs: [],
      status: 'idle',
      signature: null,

      generate: async (force = false) => {
        if (get().status === 'loading') return;
        if (!hasEnoughForRecs()) {
          set({ status: 'empty', recs: [], signature: null });
          return;
        }
        const sig = tasteSignature();
        if (!force && sig === get().signature && get().recs.length > 0) return;
        set({ status: 'loading' });
        const recs = await fetchRecommendations();
        // Keep the existing picks on a transient failure rather than blanking the
        // shelf; only mark the signature when we actually got fresh picks.
        if (recs.length) set({ recs, signature: sig, status: 'ready' });
        else set({ status: get().recs.length ? 'ready' : 'empty' });
      },

      // Call on screen mount / when the library changes. Generates on first run,
      // and regenerates when the taste signature has changed (a book finished or
      // rated) — but never on an unchanged library, so no API call per app open.
      maybeRefresh: () => {
        if (get().status === 'loading') return;
        if (!hasEnoughForRecs()) {
          if (get().recs.length || get().status !== 'empty') set({ recs: [], status: 'empty', signature: null });
          return;
        }
        const sig = tasteSignature();
        if (sig === get().signature && get().recs.length > 0) return;
        void get().generate(true);
      },

      clear: () => set({ recs: [], status: 'idle', signature: null }),
    }),
    {
      name: 'ibookshelf-recs',
      storage: createJSONStorage(() => AsyncStorage),
      // Never persist a mid-flight 'loading' state (it would wedge the UI).
      partialize: (s) => ({
        recs: s.recs,
        signature: s.signature,
        status: s.status === 'loading' ? 'idle' : s.status,
      }),
    },
  ),
);
