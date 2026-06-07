import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BookCover } from '../../components/BookCover';
import { SyncStatus } from '../../components/SyncStatus';
import { PlusIcon, SearchIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import type { ReadingStatus, ShelfBook } from '../../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

const STATUS_FOR: Record<string, ReadingStatus> = {
  Reading: 'reading',
  Finished: 'read',
  'Want to read': 'want_to_read',
};

const STATUS_DISPLAY: Record<ReadingStatus, string> = {
  reading: 'Reading',
  read: 'Finished',
  want_to_read: 'To read',
  did_not_finish: 'DNF',
  wishlist: 'Wishlist',
};

const SORT_LABEL: Record<'recent' | 'title' | 'author', string> = {
  recent: 'Recently added',
  title: 'Title A–Z',
  author: 'Author',
};

type Filter = { kind: 'all' | 'status' | 'shelf'; value: string };

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
  const [filter, setFilter] = useState<Filter>({ kind: 'all', value: 'All' });
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<'recent' | 'title' | 'author'>('recent');

  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const shelfDefs = useUserStore((s) => s.profile.shelves);

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

  const chips = useMemo(
    () => [
      { kind: 'all' as const, value: 'All', label: 'All' },
      { kind: 'status' as const, value: 'Reading', label: 'Reading' },
      { kind: 'status' as const, value: 'Finished', label: 'Finished' },
      { kind: 'status' as const, value: 'Want to read', label: 'Want to read' },
      ...shelfDefs.map((s) => ({ kind: 'shelf' as const, value: s.name, label: `${s.emoji}  ${s.name}` })),
    ],
    [shelfDefs],
  );

  const visible = useMemo(() => {
    if (filter.kind === 'all') return owned;
    if (filter.kind === 'status') return owned.filter((b) => b.shelf.status === STATUS_FOR[filter.value]);
    return owned.filter((b) => (b.shelf.shelves ?? []).includes(filter.value));
  }, [owned, filter]);

  const sorted = useMemo(() => {
    const arr = [...visible];
    if (sort === 'title') arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'author') arr.sort((a, b) => (a.author ?? '').localeCompare(b.author ?? ''));
    return arr; // 'recent' keeps the addedAt-desc order from `owned`
  }, [visible, sort]);

  const cycleSort = () => setSort((s) => (s === 'recent' ? 'title' : s === 'title' ? 'author' : 'recent'));

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
        <View style={{ flex: 1 }}>
          <Text style={sl.h1}>My Library</Text>
          <Text style={sl.sub}>
            <Text style={sl.subStrong}>{total} book{total === 1 ? '' : 's'}</Text>
            {readCount > 0 ? ` · ${readCount} read` : ' · start scanning'}
          </Text>
        </View>
        <SyncStatus />
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
              {chips.map((c) => {
                const active = filter.kind === c.kind && filter.value === c.value;
                return (
                  <TouchableOpacity
                    key={`${c.kind}:${c.value}`}
                    style={[sl.chip, active && sl.chipActive]}
                    onPress={() => setFilter({ kind: c.kind, value: c.value })}
                    activeOpacity={0.8}
                  >
                    <Text style={[sl.chipText, active && sl.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
              {/* Create a new shelf */}
              <TouchableOpacity style={sl.newChip} onPress={() => router.push('/new-shelf')} activeOpacity={0.8}>
                <Text style={sl.newChipText}>＋ Shelf</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* ── View + sort controls ─────────────────── */}
          <View style={sl.controlRow}>
            <TouchableOpacity style={sl.sortBtn} onPress={cycleSort} activeOpacity={0.7}>
              <Text style={sl.sortText}>↕  {SORT_LABEL[sort]}</Text>
            </TouchableOpacity>
            <View style={sl.viewToggle}>
              <TouchableOpacity style={[sl.viewBtn, view === 'grid' && sl.viewBtnOn]} onPress={() => setView('grid')} activeOpacity={0.8}>
                <Text style={[sl.viewGlyph, view === 'grid' && sl.viewGlyphOn]}>▦</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sl.viewBtn, view === 'list' && sl.viewBtnOn]} onPress={() => setView('list')} activeOpacity={0.8}>
                <Text style={[sl.viewGlyph, view === 'list' && sl.viewGlyphOn]}>☰</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Books: grid = wooden shelves, list = rows ─ */}
          <ScrollView
            style={sl.shelves}
            contentContainerStyle={[view === 'grid' ? sl.shelvesContent : sl.listContent, { paddingBottom: insets.bottom + 96 }]}
            showsVerticalScrollIndicator={false}
          >
            {sorted.length === 0 ? (
              <Text style={sl.filterEmpty}>No books here yet.</Text>
            ) : view === 'grid' ? (
              chunk(sorted, 3).map((row, i) => (
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
            ) : (
              sorted.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={sl.listRow}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
                >
                  <View style={sl.listCover}>
                    <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} />
                  </View>
                  <View style={sl.listText}>
                    <Text style={sl.listTitle} numberOfLines={1}>{b.title}</Text>
                    <Text style={sl.listAuthor} numberOfLines={1}>{b.author}</Text>
                  </View>
                  <Text style={sl.listStatus}>{STATUS_DISPLAY[b.shelf.status]}</Text>
                </TouchableOpacity>
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
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 22, paddingTop: 14 },
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
  newChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderStyle: 'dashed',
  },
  newChipText: { fontSize: 13, fontWeight: '800', color: BROWN },

  // ── View + sort controls
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 2, paddingBottom: 10 },
  sortBtn: { paddingVertical: 6, paddingRight: 10 },
  sortText: { fontSize: 12.5, fontWeight: '800', color: BROWN },
  viewToggle: { flexDirection: 'row', backgroundColor: '#EFE6D6', borderRadius: 999, padding: 3, gap: 2 },
  viewBtn: { width: 34, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  viewBtnOn: { backgroundColor: INK },
  viewGlyph: { fontSize: 15, color: MUTE, fontWeight: '700' },
  viewGlyphOn: { color: WHITE },

  // ── List view
  listContent: { paddingHorizontal: 22, paddingTop: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: 'rgba(139,94,60,0.10)' },
  listCover: { width: 38 },
  listText: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 15, fontWeight: '800', color: INK },
  listAuthor: { fontSize: 12.5, fontWeight: '600', color: MUTE, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 1 },
  listStatus: { fontSize: 11.5, fontWeight: '800', color: BROWN },

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
