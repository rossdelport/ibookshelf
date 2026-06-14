import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AvatarFace } from '../../components/AvatarFace';
import { BookCover } from '../../components/BookCover';
import { SyncStatus } from '../../components/SyncStatus';
import { PlusIcon, SearchIcon } from '../../components/icons';
import { ANIMALS } from '../../constants/animals';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import { usePrefsStore } from '../../store/prefsStore';
import { forceSync } from '../../lib/sync';
import { shelfChipColor } from '../../constants/shelfColors';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';
import type { ReadingStatus, ShelfBook } from '../../types/book';

const DEFAULT_AVATAR = { skin: '#E8A87C', hairStyle: 1, hairColor: '#5C3317', shirtColor: '#232A33' };

const STATUS_FOR: Record<string, ReadingStatus> = { Reading: 'reading', Finished: 'read', 'Want to read': 'want_to_read' };
const STATUS_DISPLAY: Record<ReadingStatus, string> = { reading: 'Reading', read: 'Finished', want_to_read: 'To read', did_not_finish: 'DNF', wishlist: 'Wishlist' };
const SORT_LABEL: Record<'recent' | 'title' | 'author', string> = { recent: 'Recently added', title: 'Title A–Z', author: 'Author' };

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

export default function ShelfScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>({ kind: 'all', value: 'All' });
  const view = usePrefsStore((s) => s.shelfView);
  const setView = usePrefsStore((s) => s.setShelfView);
  const sort = usePrefsStore((s) => s.shelfSort);
  const setSort = usePrefsStore((s) => s.setShelfSort);
  const [refreshing, setRefreshing] = useState(false);

  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const shelfDefs = useUserStore((s) => s.profile.shelves);
  const avatarCfg = useUserStore((s) => s.profile.avatar) ?? DEFAULT_AVATAR;
  const soulAnimal = useUserStore((s) => s.profile.soulAnimal);
  const soulEmoji = (ANIMALS.find((a) => a.name === soulAnimal) ?? ANIMALS.find((a) => a.name === 'Fox')!).emoji;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    forceSync();
    setTimeout(() => setRefreshing(false), 900);
  }, []);

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
      { kind: 'all' as const, value: 'All', label: 'All', color: undefined as string | undefined },
      { kind: 'status' as const, value: 'Reading', label: 'Reading', color: undefined as string | undefined },
      { kind: 'status' as const, value: 'Finished', label: 'Finished', color: undefined as string | undefined },
      { kind: 'status' as const, value: 'Want to read', label: 'Want to read', color: undefined as string | undefined },
      ...(shelfDefs ?? []).map((s) => ({ kind: 'shelf' as const, value: s.name, label: `${s.emoji}  ${s.name}`, color: shelfChipColor(s.color) })),
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
    return arr;
  }, [visible, sort]);

  const cycleSort = () => setSort(sort === 'recent' ? 'title' : sort === 'title' ? 'author' : 'recent');

  return (
    <View style={sl.fill}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={[sl.topbar, { paddingTop: insets.top + 4 }]}>
        <View style={sl.avatarWrap}>
          <View style={sl.avatar}>
            <AvatarFace skin={avatarCfg.skin} hairStyle={avatarCfg.hairStyle} hairColor={avatarCfg.hairColor} shirtColor={avatarCfg.shirtColor} size={42} />
          </View>
          <View style={sl.soul}><Text style={sl.soulEmoji}>{soulEmoji}</Text></View>
        </View>
        <View style={sl.topActions}>
          <TouchableOpacity style={sl.iconBtn} activeOpacity={0.7} onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel="Search your library">
            <SearchIcon color={colors.ink1} />
          </TouchableOpacity>
          <TouchableOpacity style={sl.iconBtn} activeOpacity={0.7} onPress={() => router.push('/add')} accessibilityRole="button" accessibilityLabel="Add a book">
            <PlusIcon color={colors.ink1} />
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
        <View style={sl.empty}>
          <Text style={sl.emptyEmoji}>📚</Text>
          <Text style={sl.emptyTitle}>Your shelf is empty</Text>
          <Text style={sl.emptyText}>Scan the barcode on any book you own and it'll appear here — so you always know what's already on your shelf.</Text>
          <TouchableOpacity style={sl.emptyCta} onPress={() => router.navigate('/(tabs)/scan')} activeOpacity={0.9}>
            <Text style={sl.emptyCtaText}>Scan your first book</Text>
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
                    style={[sl.chip, active && sl.chipActive, active && c.color ? { backgroundColor: c.color, borderColor: c.color } : null]}
                    onPress={() => setFilter({ kind: c.kind, value: c.value })}
                    activeOpacity={0.8}
                  >
                    <Text style={[sl.chipText, active && sl.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={sl.newChip} onPress={() => router.push('/new-shelf')} activeOpacity={0.8}>
                <Text style={sl.newChipText}>＋ Shelf</Text>
              </TouchableOpacity>
              {(shelfDefs ?? []).length > 0 && (
                <TouchableOpacity style={sl.newChip} onPress={() => router.push('/manage-shelves')} activeOpacity={0.8}>
                  <Text style={sl.newChipText}>⋯ Manage</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* ── View + sort controls ─────────────────── */}
          <View style={sl.controlRow}>
            <TouchableOpacity style={sl.sortBtn} onPress={cycleSort} activeOpacity={0.7}>
              <Text style={sl.sortText}>↕  {SORT_LABEL[sort]}</Text>
            </TouchableOpacity>
            <View style={sl.viewToggle}>
              <TouchableOpacity style={[sl.viewBtn, view === 'grid' && sl.viewBtnOn]} onPress={() => setView('grid')} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Grid view">
                <Text style={[sl.viewGlyph, view === 'grid' && sl.viewGlyphOn]}>▦</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sl.viewBtn, view === 'list' && sl.viewBtnOn]} onPress={() => setView('list')} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="List view">
                <Text style={[sl.viewGlyph, view === 'list' && sl.viewGlyphOn]}>☰</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Books: clean cover grid or list rows ──── */}
          <ScrollView
            style={sl.shelves}
            contentContainerStyle={[view === 'grid' ? sl.gridContent : sl.listContent, { paddingBottom: insets.bottom + 96 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink3} />}
          >
            {sorted.length === 0 ? (
              <Text style={sl.filterEmpty}>No books here yet.</Text>
            ) : view === 'grid' ? (
              chunk(sorted, 3).map((row, i) => (
                <View key={i} style={sl.gridRow}>
                  {row.map((b) => (
                    <TouchableOpacity key={b.id} style={sl.bookSlot} activeOpacity={0.85} onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}>
                      <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} pct={progressFor(b)} />
                    </TouchableOpacity>
                  ))}
                  {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, k) => <View key={`s${k}`} style={sl.bookSlot} />)}
                </View>
              ))
            ) : (
              sorted.map((b) => (
                <TouchableOpacity key={b.id} style={sl.listRow} activeOpacity={0.8} onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}>
                  <View style={sl.listCover}><BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} /></View>
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
    </View>
  );
}

const sl = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  avatarWrap: { width: 46, height: 46 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: colors.card, ...shadow.cardSoft },
  soul: { position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.cardSoft },
  soulEmoji: { fontSize: 12 },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },

  // ── Heading
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 22, paddingTop: 14 },
  h1: { fontFamily: fonts.semibold, ...ty.titleSm, color: colors.ink1 },
  sub: { marginTop: 4, fontFamily: fonts.medium, ...ty.body, color: colors.ink3 },
  subStrong: { color: colors.ink2, fontFamily: fonts.semibold },

  // ── Filters
  filtersWrap: { paddingTop: 14, paddingBottom: 8 },
  filters: { paddingHorizontal: 22, gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  chipTextActive: { color: colors.accentText },
  newChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong, borderStyle: 'dashed' },
  newChipText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },

  // ── View + sort controls
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 2, paddingBottom: 10 },
  sortBtn: { paddingVertical: 6, paddingRight: 10 },
  sortText: { fontFamily: fonts.semibold, ...ty.caption, color: colors.ink2 },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: 999, padding: 3, gap: 2 },
  viewBtn: { width: 34, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  viewBtnOn: { backgroundColor: colors.accent },
  viewGlyph: { fontSize: 15, color: colors.ink3 },
  viewGlyphOn: { color: colors.accentText },

  // ── List view
  listContent: { paddingHorizontal: 22, paddingTop: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  listCover: { width: 38 },
  listText: { flex: 1, minWidth: 0 },
  listTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  listAuthor: { fontFamily: fonts.serifItalic, fontSize: 13.5, color: colors.ink2, marginTop: 1 },
  listStatus: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3 },

  // ── Grid (clean covers, no plank)
  shelves: { flex: 1 },
  gridContent: { paddingHorizontal: 22, paddingTop: 12, gap: 22 },
  gridRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  bookSlot: { flex: 1 },
  filterEmpty: { textAlign: 'center', fontFamily: fonts.medium, ...ty.body, color: colors.ink3, marginTop: 40 },

  // ── Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 18 },
  emptyTitle: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1 },
  emptyText: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, textAlign: 'center', marginTop: 10 },
  emptyCta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 16, paddingHorizontal: 26, marginTop: 26, ...shadow.button },
  emptyCtaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
