import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BookCover } from '../components/BookCover';
import { CameraIcon, SearchIcon } from '../components/icons';
import { useBookshelfStore } from '../store/bookshelfStore';
import { searchBooks } from '../lib/bookLookup';
import type { Book } from '../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const GREEN = '#5BA66E';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

function Chevron() {
  return (
    <View style={a.chevronWrap}>
      <View style={a.chevronArm1} />
      <View style={a.chevronArm2} />
    </View>
  );
}

export default function AddBookScreen() {
  const addToShelf = useBookshelfStore((s) => s.addToShelf);
  const getShelfEntry = useBookshelfStore((s) => s.getShelfEntry);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const [manualOpen, setManualOpen] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mAuthor, setMAuthor] = useState('');
  const [mPages, setMPages] = useState('');
  const [mCover, setMCover] = useState<string | null>(null);

  const COVER_OPTS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.7 };

  const pickCover = () =>
    Alert.alert('Cover photo', 'Add a photo of the book cover', [
      {
        text: 'Take photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const res = await ImagePicker.launchCameraAsync(COVER_OPTS);
          if (!res.canceled) setMCover(res.assets[0].uri);
        },
      },
      {
        text: 'Choose from library',
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync(COVER_OPTS);
          if (!res.canceled) setMCover(res.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  // Debounced online title search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchBooks(q);
      setResults(r);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const owns = (id: string) => {
    const e = getShelfEntry(id);
    return !!e && e.status !== 'wishlist';
  };

  const addBook = (b: Book) => {
    addToShelf(b, 'want_to_read');
    setAdded((prev) => ({ ...prev, [b.id]: true }));
  };

  const addManual = () => {
    const title = mTitle.trim();
    if (!title) return;
    const book: Book = {
      id: `manual_${Date.now()}`,
      title,
      author: mAuthor.trim() || 'Unknown author',
      coverUrl: mCover ?? undefined,
      pageCount: mPages ? Number(mPages.replace(/[^0-9]/g, '')) : undefined,
    };
    addToShelf(book, 'want_to_read');
    router.replace({ pathname: '/book/[id]', params: { id: book.id } });
  };

  return (
    <SafeAreaView style={a.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Topbar ───────────────────────────────────── */}
        <View style={a.topbar}>
          <TouchableOpacity style={a.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Chevron />
          </TouchableOpacity>
          <Text style={a.topTitle}>Add a book</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={a.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* ── Scan shortcut ──────────────────────────── */}
          <TouchableOpacity style={a.scanCard} activeOpacity={0.85} onPress={() => router.replace('/(tabs)/scan')}>
            <View style={a.scanIcon}><CameraIcon color={WHITE} size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text style={a.scanTitle}>Scan a barcode</Text>
              <Text style={a.scanSub}>Fastest way — point at the back cover</Text>
            </View>
            <Chevron />
          </TouchableOpacity>

          {/* ── Search by title ────────────────────────── */}
          <Text style={a.sectionLabel}>Search by title or author</Text>
          <View style={a.searchField}>
            <SearchIcon color={MUTE} size={18} />
            <TextInput
              style={a.input}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Fourth Wing"
              placeholderTextColor={MUTE}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator color={MUTE} />}
          </View>

          {results.map((b) => {
            const isOwned = owns(b.id);
            const justAdded = added[b.id];
            return (
              <View key={b.id} style={a.row}>
                <View style={a.cover}>
                  <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} />
                </View>
                <View style={a.rowText}>
                  <Text style={a.rowTitle} numberOfLines={2}>{b.title}</Text>
                  <Text style={a.rowAuthor} numberOfLines={1}>{b.author}</Text>
                </View>
                {isOwned ? (
                  <Text style={a.owned}>In library</Text>
                ) : justAdded ? (
                  <Text style={a.addedTag}>Added ✓</Text>
                ) : (
                  <TouchableOpacity style={a.addBtn} onPress={() => addBook(b)} activeOpacity={0.85}>
                    <Text style={a.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <Text style={a.noResults}>No matches found. Try the exact title, or add it manually below.</Text>
          )}

          {/* ── Manual add ─────────────────────────────── */}
          <TouchableOpacity style={a.manualToggle} activeOpacity={0.7} onPress={() => setManualOpen((o) => !o)}>
            <Text style={a.manualToggleText}>{manualOpen ? '− Add manually' : '+ Add manually (no barcode / old book)'}</Text>
          </TouchableOpacity>

          {manualOpen && (
            <View style={a.manualBox}>
              <TouchableOpacity style={a.coverRow} onPress={pickCover} activeOpacity={0.8}>
                {mCover ? (
                  <Image source={{ uri: mCover }} style={a.coverThumb} resizeMode="cover" />
                ) : (
                  <View style={[a.coverThumb, a.coverPlaceholder]}>
                    <Text style={a.coverPlus}>＋</Text>
                  </View>
                )}
                <Text style={a.coverHint}>{mCover ? 'Change cover photo' : 'Add a cover photo (optional)'}</Text>
              </TouchableOpacity>

              <TextInput style={a.manualInput} value={mTitle} onChangeText={setMTitle} placeholder="Title (required)" placeholderTextColor={MUTE} />
              <TextInput style={a.manualInput} value={mAuthor} onChangeText={setMAuthor} placeholder="Author" placeholderTextColor={MUTE} />
              <TextInput style={a.manualInput} value={mPages} onChangeText={setMPages} placeholder="Pages (optional)" placeholderTextColor={MUTE} keyboardType="number-pad" />
              <TouchableOpacity
                style={[a.manualAdd, !mTitle.trim() && a.manualAddDisabled]}
                onPress={addManual}
                disabled={!mTitle.trim()}
                activeOpacity={0.85}
              >
                <Text style={a.manualAddText}>Add to library  →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const a = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)' },
  topTitle: { fontSize: 16, fontWeight: '800', color: INK },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  // Scan card
  scanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 18, padding: 14,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  scanIcon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 3,
  },
  scanTitle: { fontSize: 15.5, fontWeight: '800', color: INK },
  scanSub: { fontSize: 12.5, fontWeight: '600', color: MUTE, marginTop: 2 },

  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: '#B08A52', marginTop: 26, marginBottom: 10 },

  searchField: {
    flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: WHITE, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: INK, padding: 0 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10 },
  cover: { width: 40 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14.5, fontWeight: '800', color: INK },
  rowAuthor: { fontSize: 12, fontWeight: '600', color: MUTE, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 1 },

  addBtn: { backgroundColor: AMBER, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: WHITE, fontSize: 13.5, fontWeight: '800' },
  addedTag: { fontSize: 13, fontWeight: '800', color: GREEN },
  owned: { fontSize: 12.5, fontWeight: '800', color: MUTE },

  noResults: { fontSize: 13.5, fontWeight: '500', color: MUTE, lineHeight: 19, marginTop: 12, paddingHorizontal: 2 },

  manualToggle: { marginTop: 24, paddingVertical: 6 },
  manualToggleText: { fontSize: 14, fontWeight: '800', color: BROWN },
  manualBox: { marginTop: 10, gap: 10 },
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 2 },
  coverThumb: { width: 54, height: 81, borderRadius: 6, backgroundColor: '#F6EFE2' },
  coverPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderStyle: 'dashed',
  },
  coverPlus: { fontSize: 24, color: BROWN, fontWeight: '700' },
  coverHint: { fontSize: 13.5, fontWeight: '700', color: BROWN },
  manualInput: {
    backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, fontWeight: '500', color: INK, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  manualAdd: {
    backgroundColor: AMBER, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  manualAddDisabled: { backgroundColor: '#EFE7D8', shadowOpacity: 0, elevation: 0 },
  manualAddText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
