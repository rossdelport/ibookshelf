import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BookCover } from '../../components/BookCover';
import { PlusIcon, SearchIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import type { ReadingStatus, ShelfBook } from '../../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

const FILTERS = ['All', 'Reading', 'Finished', 'Want to read'] as const;
const STATUS_FOR: Record<string, ReadingStatus> = {
  Reading: 'reading',
  Finished: 'read',
  'Want to read': 'want_to_read',
};

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function progressFor(b: ShelfBook): number | undefined {
  if (b.shelf.status !== 'reading' || !b.pageCount) return undefined;
  return Math.min((b.shelf.currentPage ?? 0) / b.pageCount, 1);
}

// ── Wooden shelf plank (§5) ────────────────────────────────────────────────
function Plank() {
  return (
    <View style={sl.plankWrap}>
      <LinearGradient
        colors={['#CDA268', '#B5854C', '#9C6E3A']}
        locations={[0, 0.52, 1]}
        style={sl.plank}
      >
        <View style={sl.plankHighlight} />
      </LinearGradient>
      {/* Drop edge */}
      <LinearGradient colors={['#7E5226', '#65401A']} style={sl.plankEdge} />
    </View>
  );
}

export default function ShelfScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<string>('All');

  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);

  // Owned library = everything on the shelf except wishlist items.
  const owned = useMemo(
    () =>
      Object.values(shelf)
        .filter((e) => e.status !== 'wishlist')
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .map((e) => ({ ...books[e.bookId], shelf: e }))
        .filter((b): b is ShelfBook => !!b.id),
    [books, shelf],
  );

  const total = owned.length;
  const readCount = owned.filter((b) => b.shelf.status === 'read').length;

  const visible = filter === 'All' ? owned : owned.filter((b) => b.shelf.status === STATUS_FOR[filter]);

  return (
    <LinearGradient colors={['#FAF8F3', '#F3ECDF']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={sl.fill}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={[sl.topbar, { paddingTop: insets.top + 4 }]}>
        <View style={sl.avatarWrap}>
          <Image source={require('../../assets/images/av_me.png')} style={sl.avatar} resizeMode="cover" />
          <View style={sl.soul}><Text style={sl.soulEmoji}>🦊</Text></View>
        </View>
        <View style={sl.topActions}>
          <TouchableOpacity style={sl.iconBtn} activeOpacity={0.7} onPress={() => router.push('/search')}>
            <SearchIcon color={INK} />
          </TouchableOpacity>
          <TouchableOpacity style={sl.iconBtn} activeOpacity={0.7} onPress={() => router.push('/add')}>
            <PlusIcon color={INK} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Heading ──────────────────────────────────── */}
      <View style={sl.head}>
        <Text style={sl.h1}>My Library</Text>
        <Text style={sl.sub}>
          <Text style={sl.subStrong}>{total} book{total === 1 ? '' : 's'}</Text>
          {readCount > 0 ? ` · ${readCount} read` : ' · start scanning'}
        </Text>
      </View>

      {total === 0 ? (
        // ── Empty state ──────────────────────────────
        <View style={sl.empty}>
          <Text style={sl.emptyEmoji}>📚</Text>
          <Text style={sl.emptyTitle}>Your shelf is empty</Text>
          <Text style={sl.emptyText}>
            Scan the barcode on any book you own and it'll appear here — so you always know what's already on your shelf.
          </Text>
          <TouchableOpacity style={sl.emptyCta} onPress={() => router.navigate('/(tabs)/scan')} activeOpacity={0.85}>
            <Text style={sl.emptyCtaText}>Scan your first book  →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── Filter chips ─────────────────────────── */}
          <View style={sl.filtersWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sl.filters}>
              {FILTERS.map((f) => {
                const active = f === filter;
                return (
                  <TouchableOpacity key={f} style={[sl.chip, active && sl.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
                    <Text style={[sl.chipText, active && sl.chipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Wooden shelves, 3 across ─────────────── */}
          <ScrollView
            style={sl.shelves}
            contentContainerStyle={[sl.shelvesContent, { paddingBottom: insets.bottom + 96 }]}
            showsVerticalScrollIndicator={false}
          >
            {visible.length === 0 ? (
              <Text style={sl.filterEmpty}>No books here yet.</Text>
            ) : (
              chunk(visible, 3).map((row, i) => (
                <View key={i} style={sl.row}>
                  <View style={sl.books}>
                    {row.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={sl.bookSlot}
                        activeOpacity={0.85}
                        onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
                      >
                        <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} pct={progressFor(b)} />
                      </TouchableOpacity>
                    ))}
                    {/* keep last row left-aligned if fewer than 3 */}
                    {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, k) => <View key={`s${k}`} style={sl.bookSlot} />)}
                  </View>
                  <Plank />
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </LinearGradient>
  );
}

const sl = StyleSheet.create({
  fill: { flex: 1 },

  // ── Topbar (shared pattern)
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 4 },
  avatarWrap: { width: 46, height: 46 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: WHITE,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  soul: {
    position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2,
  },
  soulEmoji: { fontSize: 12 },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.14)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 1,
  },

  // ── Heading
  head: { paddingHorizontal: 22, paddingTop: 14 },
  h1: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5, color: INK },
  sub: { marginTop: 4, fontSize: 13.5, fontWeight: '600', color: MUTE },
  subStrong: { color: BROWN, fontWeight: '700' },

  // ── Filters
  filtersWrap: { paddingTop: 14, paddingBottom: 8 },
  filters: { paddingHorizontal: 22, gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, backgroundColor: WHITE,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.16)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { fontSize: 13, fontWeight: '700', color: BROWN },
  chipTextActive: { color: WHITE },

  // ── Shelves
  shelves: { flex: 1 },
  shelvesContent: { paddingHorizontal: 22, paddingTop: 12, gap: 32 },
  row: {},
  books: { flexDirection: 'row', alignItems: 'flex-end', gap: 18, zIndex: 2 },
  bookSlot: { flex: 1 },
  filterEmpty: { textAlign: 'center', color: MUTE, fontSize: 14, fontWeight: '600', marginTop: 40 },

  // Wooden plank
  plankWrap: { marginTop: -2, zIndex: 1 },
  plank: {
    height: 14, borderRadius: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 3,
  },
  plankHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  plankEdge: {
    height: 7, marginHorizontal: -5, borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    shadowColor: '#462D14', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 11, elevation: 4,
  },

  // ── Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 18 },
  emptyTitle: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', color: INK },
  emptyText: { fontSize: 14.5, fontWeight: '500', color: MUTE, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  emptyCta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 26, marginTop: 26,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  emptyCtaText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
