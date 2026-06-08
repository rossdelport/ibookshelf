import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { setSyncUser, fetchRemoteState, pushProfile, pushBook, initSync } from '../lib/sync';

// On sign-in, reconcile local (offline/onboarding) state with the cloud:
// remote values win when present; anything that only exists locally is pushed up.
async function handleSignedIn(userId: string) {
  setSyncUser(userId);
  const remote = await fetchRemoteState();
  if (!remote) return;

  const local = useUserStore.getState().profile;
  const rp = remote.profile;
  const mergedProfile = {
    username: rp?.username ?? local.username,
    librarySize: rp?.library_size ?? local.librarySize,
    favouriteGenres: rp?.favourite_genres && rp.favourite_genres.length ? rp.favourite_genres : local.favouriteGenres,
    soulAnimal: rp?.soul_animal ?? local.soulAnimal,
    avatar: (rp?.avatar as typeof local.avatar) ?? local.avatar,
    shelves: rp?.shelves?.length ? rp.shelves : (local.shelves ?? []),
  };
  useUserStore.getState().hydrateProfile(mergedProfile);

  const localBooks = useBookshelfStore.getState().books;
  const localShelf = useBookshelfStore.getState().shelf;
  useBookshelfStore.getState().hydrate(
    { ...localBooks, ...remote.books },
    { ...localShelf, ...remote.shelf },
  );

  // Flush merged profile + any books that only existed locally up to the cloud.
  pushProfile(mergedProfile);
  Object.keys(localBooks).forEach((id) => {
    if (!remote.books[id] && localShelf[id]) pushBook(localBooks[id], localShelf[id]);
  });
}

function handleSignedOut() {
  setSyncUser(null);
  useBookshelfStore.getState().clear();
  useUserStore.getState().reset();
}

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    let mounted = true;
    // Load the persisted sync queue + wire connectivity/foreground flush triggers.
    initSync();
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) handleSignedIn(session.user.id);
      else handleSignedOut();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setInitializing]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding/unread" />
        <Stack.Screen name="onboarding/mirror" />
        <Stack.Screen name="onboarding/genres" />
        <Stack.Screen name="onboarding/avatar" />
        <Stack.Screen name="onboarding/soul" />
        <Stack.Screen name="onboarding/shelf" />
        <Stack.Screen name="onboarding/signup" />
        <Stack.Screen name="onboarding/scan" />
        <Stack.Screen name="onboarding/review" />
        <Stack.Screen
          name="onboarding/soul-detail"
          options={{
            presentation: 'transparentModal',
            // No native transition — the screen drives its own rotate/scale + scrim fade
            animation: 'none',
            headerShown: false,
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="wishlist-item" />
        <Stack.Screen name="search" />
        <Stack.Screen name="add" />
        <Stack.Screen name="new-shelf" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-shelf" options={{ presentation: 'modal' }} />
        <Stack.Screen name="manage-shelves" options={{ presentation: 'modal' }} />
        <Stack.Screen name="change-cover" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
