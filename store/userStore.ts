import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushProfile } from '../lib/sync';

const EMPTY_PROFILE: UserProfile = {
  librarySize: null,
  favouriteGenres: [],
  soulAnimal: null,
  avatar: null,
};

// Holds onboarding + profile data locally until Supabase sync is wired up.
// When Supabase is added: subscribe to this store and upsert to the `profiles` table.

// Procedural avatar appearance chosen in onboarding/avatar.
export interface AvatarConfig {
  gender: 'male' | 'female';
  skin: string;        // hex tone
  hairStyle: number;   // index 0–5
  hairColor: string;   // hex colour
}

export interface UserProfile {
  librarySize: string | null;      // 'Under 20' | '20–50' | '50–150' | '150+'
  favouriteGenres: string[];       // genre labels selected in onboarding
  soulAnimal: string | null;       // e.g. 'Fox'
  avatar: AvatarConfig | null;     // saved appearance from the avatar builder
}

interface UserState {
  profile: UserProfile;
  setLibrarySize: (value: string) => void;
  setFavouriteGenres: (genres: string[]) => void;
  toggleGenre: (genre: string) => void;
  setSoulAnimal: (animal: string) => void;
  setAvatar: (avatar: AvatarConfig) => void;
  hydrateProfile: (profile: UserProfile) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: { ...EMPTY_PROFILE },

      setLibrarySize: (value) => {
        set((s) => ({ profile: { ...s.profile, librarySize: value } }));
        pushProfile(get().profile); // no-op when signed out
      },

      setFavouriteGenres: (genres) => {
        set((s) => ({ profile: { ...s.profile, favouriteGenres: genres } }));
        pushProfile(get().profile);
      },

      toggleGenre: (genre) => {
        const current = get().profile.favouriteGenres;
        const next = current.includes(genre)
          ? current.filter((g) => g !== genre)
          : [...current, genre];
        set((s) => ({ profile: { ...s.profile, favouriteGenres: next } }));
        pushProfile(get().profile);
      },

      setSoulAnimal: (animal) => {
        set((s) => ({ profile: { ...s.profile, soulAnimal: animal } }));
        pushProfile(get().profile);
      },

      setAvatar: (avatar) => {
        set((s) => ({ profile: { ...s.profile, avatar } }));
        pushProfile(get().profile);
      },

      // Replace local profile from a remote pull (no push-back).
      hydrateProfile: (profile) => set({ profile }),

      // Wipe local profile on sign-out.
      reset: () => set({ profile: { ...EMPTY_PROFILE } }),
    }),
    {
      name: 'ibookshelf-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
    },
  ),
);
