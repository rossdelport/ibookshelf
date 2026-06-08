import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BookCover } from '../../components/BookCover';
import { HeartIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { forceSync } from '../../lib/sync';
import type { Book, ShelfBook } from '../../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const addToShelf = useBookshelfStore((s) => s.addToShelf);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    forceSync();
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const items = useMemo(
    () =>
      Object.values(shelf)
        .filter((e) => e.status === 'wishlist')
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .map((e) => ({ ...books[e.bookId], shelf: e }))
        .filter((b): b is ShelfBook => !!b.id),
    [books, shelf],
  );

  // "I own this" — move a wishlisted book into the owned library (keeps notes).
  const ownIt = (b: ShelfBook) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { shelf: _entry, ...book } = b; // strip the entry so we store a clean Book
    addToShelf(book as Book, 'want_to_read');
  };

  return (
    <LinearGradient colors={['#FAF8F3', '#F3ECDF']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={w.fill}>
      {/* ── Heading ──────────────────────────────────── */}
      <View style={[w.head, { paddingTop: insets.top + 18 }]}>
        <Text style={w.h1}>Wishlist</Text>
        <Text style={w.sub}>
          {items.length > 0
            ? `${items.length} book${items.length === 1 ? '' : 's'} you want`
            : 'Books you want but don’t own yet'}
        </Text>
      </View>

      {items.length === 0 ? (
        // ── Empty state ────────────────────────────────
        <View style={w.empty}>
          <View style={w.emptyIcon}><HeartIcon color={AMBER} size={42} /></View>
          <Text style={w.emptyTitle}>Your wishlist is empty</Text>
          <Text style={w.emptyText}>
            Scanning a book you don’t own yet? Tap “Add to Wishlist” and it’ll wait here — so you remember what to look for next time you’re in a shop.
          </Text>
          <TouchableOpacity style={w.cta} onPress={() => router.navigate('/(tabs)/scan')} activeOpacity={0.85}>
            <Text style={w.ctaText}>Scan a book  →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[w.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BROWN} colors={[AMBER]} />}
        >
          {items.map((b) => {
            const meta = [b.publishedYear, b.pageCount ? `${b.pageCount} pp` : null].filter(Boolean).join(' · ');
            return (
              <View key={b.id} style={w.card}>
                <TouchableOpacity
                  style={w.cardMain}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
                >
                  <View style={w.cover}>
                    <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} />
                  </View>
                  <View style={w.text}>
                    <Text style={w.title} numberOfLines={2}>{b.title}</Text>
                    <Text style={w.author} numberOfLines={1}>{b.author}</Text>
                    {!!meta && <Text style={w.meta}>{meta}</Text>}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={w.ownBtn}
                  onPress={() => ownIt(b)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${b.title} to your library`}
                >
                  <Text style={w.ownText}>I own this</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const w = StyleSheet.create({
  fill: { flex: 1 },

  head: { paddingHorizontal: 22, paddingBottom: 6 },
  h1: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5, color: INK },
  sub: { marginTop: 4, fontSize: 13.5, fontWeight: '600', color: MUTE },

  // ── List
  list: { paddingHorizontal: 22, paddingTop: 14, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 18, padding: 12,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, minWidth: 0 },
  cover: { width: 46 },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Georgia', fontSize: 16.5, fontWeight: '600', lineHeight: 20, color: INK },
  author: { fontSize: 13, fontWeight: '700', color: BROWN, marginTop: 3 },
  meta: { fontSize: 12, fontWeight: '600', color: MUTE, marginTop: 4 },

  ownBtn: {
    alignSelf: 'center', backgroundColor: '#FBEACB', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14,
  },
  ownText: { fontSize: 12.5, fontWeight: '800', color: '#C0851E' },

  // ── Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#FBF1DC', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  emptyTitle: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: INK },
  emptyText: { fontSize: 14.5, fontWeight: '500', color: MUTE, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 26, marginTop: 26,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
