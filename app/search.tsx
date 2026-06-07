import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookCover } from '../components/BookCover';
import { SearchIcon } from '../components/icons';
import { useBookshelfStore } from '../store/bookshelfStore';
import type { ReadingStatus, ShelfBook } from '../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const STATUS_LABEL: Record<ReadingStatus, string> = {
  reading: 'Reading',
  read: 'Finished',
  want_to_read: 'Want to read',
  did_not_finish: 'DNF',
  wishlist: 'Wishlist',
};

function Chevron() {
  return (
    <View style={s.chevronWrap}>
      <View style={s.chevronArm1} />
      <View style={s.chevronArm2} />
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const books = useBookshelfStore((st) => st.books);
  const shelf = useBookshelfStore((st) => st.shelf);

  const all = useMemo<ShelfBook[]>(
    () =>
      Object.values(shelf)
        .map((e) => ({ ...books[e.bookId], shelf: e }))
        .filter((b): b is ShelfBook => !!b.id)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [books, shelf],
  );

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q.length === 0
        ? all
        : all.filter(
            (b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q),
          ),
    [all, q],
  );

  const libraryEmpty = all.length === 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Search bar ───────────────────────────────── */}
      <View style={s.topbar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={s.searchField}>
          <SearchIcon color={MUTE} size={18} />
          <TextInput
            style={s.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your library"
            placeholderTextColor={MUTE}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Text style={s.clear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {libraryEmpty ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>Your library is empty</Text>
            <Text style={s.emptyText}>Add a book and it'll be searchable here.</Text>
            <TouchableOpacity style={s.addCta} onPress={() => router.replace('/add')} activeOpacity={0.85}>
              <Text style={s.addCtaText}>Add a book  →</Text>
            </TouchableOpacity>
          </View>
        ) : results.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No matches for “{query.trim()}”</Text>
            <Text style={s.emptyText}>It might not be in your library yet.</Text>
            <TouchableOpacity style={s.addCta} onPress={() => router.replace('/add')} activeOpacity={0.85}>
              <Text style={s.addCtaText}>Add a book  →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.count}>{results.length} book{results.length === 1 ? '' : 's'}</Text>
            {results.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={s.row}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
              >
                <View style={s.cover}>
                  <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowTitle} numberOfLines={2}>{b.title}</Text>
                  <Text style={s.rowAuthor} numberOfLines={1}>{b.author}</Text>
                  <Text style={s.rowStatus}>{STATUS_LABEL[b.shelf.status]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: INK, padding: 0 },
  clear: { fontSize: 15, fontWeight: '700', color: MUTE, paddingHorizontal: 4 },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  count: { fontSize: 12.5, fontWeight: '700', color: MUTE, marginBottom: 12, marginLeft: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 9,
  },
  cover: { width: 42 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: INK },
  rowAuthor: { fontSize: 12.5, fontWeight: '600', color: MUTE, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 1 },
  rowStatus: { fontSize: 11.5, fontWeight: '800', color: BROWN, marginTop: 4 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontFamily: 'Georgia', fontSize: 19, fontWeight: '600', color: INK, textAlign: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500', color: MUTE, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  addCta: {
    backgroundColor: AMBER, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, marginTop: 22,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  addCtaText: { color: WHITE, fontSize: 15.5, fontWeight: '800', letterSpacing: 0.2 },
});
