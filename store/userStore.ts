import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushProfile } from '../lib/sync';
import type { ShelfDef } from '../types/book';

const EMPTY_PROFILE: UserProfile = {
  librarySize: null,
  favouriteGenres: [],
  soulAnimal: null,
  avatar: null,
  shelves: [],
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
  shelves: ShelfDef[];             // custom shelves / collections the user made
}

interface UserState {
  profile: UserProfile;
  setLibrarySize: (value: string) => void;
  setFavouriteGenres: (genres: string[]) => void;
  toggleGenre: (genre: string) => void;
  setSoulAnimal: (animal: string) => void;
  setAvatar: (avatar: AvatarConfig) => void;
  addShelf: (name: string, emoji: string, color?: string) => void;
  updateShelf: (oldName: string, def: ShelfDef) => void;
  moveShelf: (name: string, dir: 'up' | 'down') => void;
  removeShelf: (name: string) => void;
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

      addShelf: (name, emoji, color) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const current = get().profile.shelves;
        // Case-insensitive de-dupe so "Tom" and "tom" don't both appear.
        if (current.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
        set((s) => ({ profile: { ...s.profile, shelves: [...s.profile.shelves, { name: trimmed, emoji, color }] } }));
        pushProfile(get().profile);
      },

      // Edit a shelf's name/emoji/colour in place (keeps its position). Blocks a
      // rename that would collide with a *different* existing shelf. The caller
      // is responsible for cascading a rename across book membership (see
      // bookshelfStore.renameShelfMembership).
      updateShelf: (oldName, def) => {
        const newName = def.name.trim();
        if (!newName) return;
        const current = get().profile.shelves;
        const collision = current.some(
          (s) => s.name !== oldName && s.name.toLowerCase() === newName.toLowerCase(),
        );
        if (collision) return;
        set((s) => ({
          profile: {
            ...s.profile,
            shelves: s.profile.shelves.map((sh) =>
              sh.name === oldName ? { name: newName, emoji: def.emoji, color: def.color } : sh,
            ),
          },
        }));
        pushProfile(get().profile);
      },

      // Reorder a shelf by swapping it with its neighbour.
      moveShelf: (name, dir) => {
        const shelves = [...get().profile.shelves];
        const i = shelves.findIndex((s) => s.name === name);
        if (i === -1) return;
        const j = dir === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= shelves.length) return;
        [shelves[i], shelves[j]] = [shelves[j], shelves[i]];
        set((s) => ({ profile: { ...s.profile, shelves } }));
        pushProfile(get().profile);
      },

      removeShelf: (name) => {
        set((s) => ({ profile: { ...s.profile, shelves: s.profile.shelves.filter((sh) => sh.name !== name) } }));
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
