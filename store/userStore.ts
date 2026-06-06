import { create } from 'zustand';

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
  unreadCount: string | null;      // '0-5' | '5-10' | '10-20' | '20+'
  favouriteGenres: string[];       // genre labels selected in onboarding
  soulAnimal: string | null;       // e.g. 'Fox'
  avatar: AvatarConfig | null;     // saved appearance from the avatar builder
}

interface UserState {
  profile: UserProfile;
  setUnreadCount: (value: string) => void;
  setFavouriteGenres: (genres: string[]) => void;
  toggleGenre: (genre: string) => void;
  setSoulAnimal: (animal: string) => void;
  setAvatar: (avatar: AvatarConfig) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: {
    unreadCount: null,
    favouriteGenres: [],
    soulAnimal: null,
    avatar: null,
  },

  setUnreadCount: (value) =>
    set((s) => ({ profile: { ...s.profile, unreadCount: value } })),

  setFavouriteGenres: (genres) =>
    set((s) => ({ profile: { ...s.profile, favouriteGenres: genres } })),

  toggleGenre: (genre) => {
    const current = get().profile.favouriteGenres;
    const next = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    set((s) => ({ profile: { ...s.profile, favouriteGenres: next } }));
  },

  setSoulAnimal: (animal) =>
    set((s) => ({ profile: { ...s.profile, soulAnimal: animal } })),

  setAvatar: (avatar) =>
    set((s) => ({ profile: { ...s.profile, avatar } })),
}));
