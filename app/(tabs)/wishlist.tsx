import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookCover } from '../../components/BookCover';
import { ChevronIcon, HeartIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { forceSync } from '../../lib/sync';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';
import type { ShelfBook } from '../../types/book';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
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

  return (
    <View style={w.fill}>
      {/* ── Heading ──────────────────────────────────── */}
      <View style={[w.head, { paddingTop: insets.top + 18 }]}>
        <Text style={w.h1}>Wishlist</Text>
        <Text style={w.sub}>
          {items.length > 0 ? `${items.length} book${items.length === 1 ? '' : 's'} you want` : 'Books you want but don’t own yet'}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={w.empty}>
          <View style={w.emptyIcon}><HeartIcon color={colors.ink3} size={42} /></View>
          <Text style={w.emptyTitle}>Your wishlist is empty</Text>
          <Text style={w.emptyText}>
            Scanning a book you don’t own yet? Tap “Add to Wishlist” and it’ll wait here — so you remember what to look for next time you’re in a shop.
          </Text>
          <TouchableOpacity style={w.cta} onPress={() => router.navigate('/(tabs)/scan')} activeOpacity={0.9}>
            <Text style={w.ctaText}>Scan a book</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[w.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink3} />}
        >
          {items.map((b) => {
            const meta = [b.publishedYear, b.pageCount ? `${b.pageCount} pp` : null].filter(Boolean).join(' · ');
            return (
              <TouchableOpacity
                key={b.id}
                style={w.card}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/wishlist-item', params: { id: b.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${b.title}`}
              >
                <View style={w.cover}><BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} /></View>
                <View style={w.text}>
                  <Text style={w.title} numberOfLines={2}>{b.title}</Text>
                  <Text style={w.author} numberOfLines={1}>{b.author}</Text>
                  {!!meta && <Text style={w.meta}>{meta}</Text>}
                </View>
                <ChevronIcon color={colors.ink3} size={18} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const w = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },

  head: { paddingHorizontal: 22, paddingBottom: 6 },
  h1: { fontFamily: fonts.semibold, ...ty.titleSm, color: colors.ink1 },
  sub: { marginTop: 4, fontFamily: fonts.medium, ...ty.body, color: colors.ink3 },

  // ── List
  list: { paddingHorizontal: 22, paddingTop: 14, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 12, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  cover: { width: 46 },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  author: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink2, marginTop: 3 },
  meta: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 4 },

  // ── Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1 },
  emptyText: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, textAlign: 'center', marginTop: 10 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 16, paddingHorizontal: 26, marginTop: 26, ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
