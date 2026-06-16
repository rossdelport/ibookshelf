import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BookCover } from './BookCover';
import { PressableScale } from './anim';
import { useBookshelfStore } from '../store/bookshelfStore';
import { useUserStore } from '../store/userStore';
import { useRecsStore } from '../store/recsStore';
import { colors, fonts, radius, type as ty } from '../constants/theme';
import type { Book } from '../types/book';

// ── "For you" — quiet, editorial book recommendations ──────────────────────
// Two variants share one data source (useRecsStore):
//   • teaser — a short row on Home that taps through to the Shelf tab
//   • full   — a horizontal strip on the Shelf tab with a one-line "why" and a
//              one-tap "Add to wishlist" on each pick.
// Deliberately understated: no "AI", no badges — it reads like a friend's note.

// Keeps the recs fresh when the library changes, without coupling stores: the
// effect re-runs on any shelf/genre change, and maybeRefresh() only actually
// refetches when the taste signature (loved books + genres) has moved.
function useRefreshTrigger() {
  const shelf = useBookshelfStore((s) => s.shelf);
  const genres = useUserStore((s) => s.profile.favouriteGenres);
  const maybeRefresh = useRecsStore((s) => s.maybeRefresh);
  useEffect(() => {
    maybeRefresh();
  }, [shelf, genres, maybeRefresh]);
}

export function ForYou({ variant }: { variant: 'teaser' | 'full' }) {
  useRefreshTrigger();
  const recs = useRecsStore((s) => s.recs);
  const status = useRecsStore((s) => s.status);

  if (variant === 'teaser') {
    if (status !== 'ready' || recs.length === 0) return null;
    return <Teaser />;
  }

  // full
  if (recs.length === 0) {
    if (status === 'loading') {
      return (
        <View style={fy.block}>
          <Header />
          <Text style={fy.loading}>Finding a few you'll love…</Text>
        </View>
      );
    }
    return null;
  }
  return <Full />;
}

// ── Shared header ──────────────────────────────────────────────────────────
function Header({ onSeeAll }: { onSeeAll?: () => void }) {
  return (
    <View style={fy.head}>
      <View style={{ flex: 1 }}>
        <Text style={fy.title}>For you</Text>
        <Text style={fy.sub}>A few your shelf might love</Text>
      </View>
      {onSeeAll && (
        <PressableScale onPress={onSeeAll} style={fy.seeAll}>
          <Text style={fy.seeAllText}>See all</Text>
          <Text style={fy.seeAllArrow}>→</Text>
        </PressableScale>
      )}
    </View>
  );
}

// ── Teaser (Home) ──────────────────────────────────────────────────────────
function Teaser() {
  const recs = useRecsStore((s) => s.recs).slice(0, 3);
  const goToShelf = () => {
    Haptics.selectionAsync();
    router.navigate('/(tabs)/shelf');
  };
  return (
    <PressableScale style={fy.teaser} onPress={goToShelf} scaleTo={0.985}>
      <Header onSeeAll={goToShelf} />
      <View style={fy.teaserRow}>
        {recs.map((r) => (
          <View key={r.book.id} style={fy.teaserCover}>
            <BookCover title={r.book.title} author={r.book.author} coverUrl={r.book.coverUrl} />
          </View>
        ))}
      </View>
    </PressableScale>
  );
}

// ── Full strip (Shelf) ─────────────────────────────────────────────────────
function Full() {
  const recs = useRecsStore((s) => s.recs);
  const addToShelf = useBookshelfStore((s) => s.addToShelf);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const add = (book: Book) => {
    if (added[book.id]) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToShelf(book, 'wishlist');
    setAdded((m) => ({ ...m, [book.id]: true }));
  };

  return (
    <View style={fy.block}>
      <Header />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fy.strip}
      >
        {recs.map((r) => {
          const isAdded = !!added[r.book.id];
          return (
            <View key={r.book.id} style={fy.card}>
              <PressableScale onPress={() => add(r.book)} style={fy.cardCover}>
                <BookCover title={r.book.title} author={r.book.author} coverUrl={r.book.coverUrl} />
              </PressableScale>
              <Text style={fy.cardTitle} numberOfLines={1}>{r.book.title}</Text>
              <Text style={fy.cardAuthor} numberOfLines={1}>{r.book.author}</Text>
              {!!r.reason && <Text style={fy.reason} numberOfLines={3}>{r.reason}</Text>}
              <PressableScale
                onPress={() => add(r.book)}
                style={[fy.addBtn, isAdded && fy.addBtnDone]}
              >
                <Text style={[fy.addText, isAdded && fy.addTextDone]}>
                  {isAdded ? '✓ Wishlist' : '+ Wishlist'}
                </Text>
              </PressableScale>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const COVER_W = 116;

const fy = StyleSheet.create({
  // ── Shared
  block: { marginTop: 6, marginBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 22 },
  title: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1 },
  sub: { fontFamily: fonts.serifItalic, ...ty.editorial, fontSize: 14.5, lineHeight: 19, color: colors.ink3, marginTop: 2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingLeft: 10 },
  seeAllText: { fontFamily: fonts.semibold, ...ty.caption, color: colors.ink2 },
  seeAllArrow: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink2 },
  loading: { fontFamily: fonts.serifItalic, ...ty.editorial, color: colors.ink3, paddingHorizontal: 22, marginTop: 12 },

  // ── Teaser (Home)
  teaser: { marginHorizontal: 22, marginTop: 12, backgroundColor: colors.card, borderRadius: radius.card, paddingTop: 16, paddingBottom: 18, borderWidth: 1, borderColor: colors.line },
  teaserRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 22, marginTop: 14 },
  teaserCover: { width: 52 },

  // ── Full strip (Shelf)
  strip: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4, gap: 16 },
  card: { width: COVER_W },
  cardCover: { width: COVER_W, marginBottom: 10 },
  cardTitle: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink1 },
  cardAuthor: { fontFamily: fonts.serifItalic, fontSize: 12.5, color: colors.ink2, marginTop: 1 },
  reason: { fontFamily: fonts.serifItalic, fontSize: 13, lineHeight: 18, color: colors.ink2, marginTop: 6 },
  addBtn: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.chip },
  addBtnDone: { backgroundColor: colors.successSoft },
  addText: { fontFamily: fonts.semibold, ...ty.caption, color: colors.ink1 },
  addTextDone: { color: colors.success },
});
