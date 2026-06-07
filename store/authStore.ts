import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  initializing: boolean; // true until the first getSession resolves
  setSession: (session: Session | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initializing: true,
  setSession: (session) => set({ session }),
  setInitializing: (value) => set({ initializing: value }),
}));
