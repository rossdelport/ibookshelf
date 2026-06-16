import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { BookCover } from '../components/BookCover';
import { CameraIcon, SearchIcon } from '../components/icons';
import { useBookshelfStore } from '../store/bookshelfStore';
import { searchBooks } from '../lib/bookLookup';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';
import type { Book } from '../types/book';

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
      { text: 'Take photo', onPress: async () => { const perm = await ImagePicker.requestCameraPermissionsAsync(); if (!perm.granted) return; const res = await ImagePicker.launchCameraAsync(COVER_OPTS); if (!res.canceled) setMCover(res.assets[0].uri); } },
      { text: 'Choose from library', onPress: async () => { const res = await ImagePicker.launchImageLibraryAsync(COVER_OPTS); if (!res.canceled) setMCover(res.assets[0].uri); } },
      { text: 'Cancel', style: 'cancel' },
    ]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => { const r = await searchBooks(q); setResults(r); setSearching(false); }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const owns = (id: string) => { const e = getShelfEntry(id); return !!e && e.status !== 'wishlist'; };

  const addBook = (b: Book) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToShelf(b, 'want_to_read');
    setAdded((prev) => ({ ...prev, [b.id]: true }));
  };

  const addManual = () => {
    const title = mTitle.trim();
    if (!title) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const book: Book = { id: `manual_${Date.now()}`, title, author: mAuthor.trim() || 'Unknown author', coverUrl: mCover ?? undefined, pageCount: mPages ? Number(mPages.replace(/[^0-9]/g, '')) : undefined };
    addToShelf(book, 'want_to_read');
    router.replace({ pathname: '/book/[id]', params: { id: book.id } });
  };

  return (
    <SafeAreaView style={a.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={a.topbar}>
          <TouchableOpacity style={a.backBtn} onPress={() => router.back()} activeOpacity={0.7}><Chevron /></TouchableOpacity>
          <Text style={a.topTitle}>Add a book</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={a.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* ── Scan shortcut ──────────────────────────── */}
          <TouchableOpacity style={a.scanCard} activeOpacity={0.85} onPress={() => router.replace('/(tabs)/scan')}>
            <View style={a.scanIcon}><CameraIcon color={colors.accentText} size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text style={a.scanTitle}>Scan a barcode</Text>
              <Text style={a.scanSub}>Fastest way — point at the back cover</Text>
            </View>
            <Chevron />
          </TouchableOpacity>

          {/* ── Import from Goodreads / StoryGraph ─────── */}
          <TouchableOpacity style={a.importCard} activeOpacity={0.85} onPress={() => router.push('/import')}>
            <View style={a.importIcon}><Text style={a.importGlyph}>📚</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={a.scanTitle}>Import your library</Text>
              <Text style={a.scanSub}>Bring your books from Goodreads or StoryGraph</Text>
            </View>
            <Chevron />
          </TouchableOpacity>

          {/* ── Search by title ────────────────────────── */}
          <Text style={a.sectionLabel}>Search by title or author</Text>
          <View style={a.searchField}>
            <SearchIcon color={colors.ink3} size={18} />
            <TextInput style={a.input} value={query} onChangeText={setQuery} placeholder="e.g. Fourth Wing" placeholderTextColor={colors.ink3} autoCorrect={false} returnKeyType="search" />
            {searching && <ActivityIndicator color={colors.ink3} />}
          </View>

          {results.map((b) => {
            const isOwned = owns(b.id);
            const justAdded = added[b.id];
            return (
              <View key={b.id} style={a.row}>
                <View style={a.cover}><BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} /></View>
                <View style={a.rowText}>
                  <Text style={a.rowTitle} numberOfLines={2}>{b.title}</Text>
                  <Text style={a.rowAuthor} numberOfLines={1}>{b.author}</Text>
                </View>
                {isOwned ? (
                  <Text style={a.owned}>In library</Text>
                ) : justAdded ? (
                  <Text style={a.addedTag}>Added ✓</Text>
                ) : (
                  <TouchableOpacity style={a.addBtn} onPress={() => addBook(b)} activeOpacity={0.9}><Text style={a.addBtnText}>Add</Text></TouchableOpacity>
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
                  <View style={[a.coverThumb, a.coverPlaceholder]}><Text style={a.coverPlus}>＋</Text></View>
                )}
                <Text style={a.coverHint}>{mCover ? 'Change cover photo' : 'Add a cover photo (optional)'}</Text>
              </TouchableOpacity>

              <TextInput style={a.manualInput} value={mTitle} onChangeText={setMTitle} placeholder="Title (required)" placeholderTextColor={colors.ink3} />
              <TextInput style={a.manualInput} value={mAuthor} onChangeText={setMAuthor} placeholder="Author" placeholderTextColor={colors.ink3} />
              <TextInput style={a.manualInput} value={mPages} onChangeText={setMPages} placeholder="Pages (optional)" placeholderTextColor={colors.ink3} keyboardType="number-pad" />
              <TouchableOpacity style={[a.manualAdd, !mTitle.trim() && a.manualAddDisabled]} onPress={addManual} disabled={!mTitle.trim()} activeOpacity={0.9}>
                <Text style={[a.manualAddText, !mTitle.trim() && a.manualAddTextDisabled]}>Add to library</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const a = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink1 },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },

  scanCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.card, padding: 14, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  scanIcon: { width: 46, height: 46, borderRadius: radius.chip, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  scanSub: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 2 },

  importCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.card, padding: 14, marginTop: 12, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  importIcon: { width: 46, height: 46, borderRadius: radius.chip, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  importGlyph: { fontSize: 22 },

  sectionLabel: { fontFamily: fonts.medium, ...ty.eyebrow, textTransform: 'uppercase', color: colors.ink3, marginTop: 26, marginBottom: 10 },

  searchField: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: colors.ink1, padding: 0 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10 },
  cover: { width: 40 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  rowAuthor: { fontFamily: fonts.serifItalic, fontSize: 13, color: colors.ink2, marginTop: 1 },

  addBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18 },
  addBtnText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.bodySm },
  addedTag: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.success },
  owned: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3 },

  noResults: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, marginTop: 12, paddingHorizontal: 2 },

  manualToggle: { marginTop: 24, paddingVertical: 6 },
  manualToggleText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },
  manualBox: { marginTop: 10, gap: 10 },
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 2 },
  coverThumb: { width: 54, height: 81, borderRadius: 6, backgroundColor: colors.chip },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lineStrong, borderStyle: 'dashed' },
  coverPlus: { fontSize: 24, color: colors.ink3 },
  coverHint: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  manualInput: { backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 14, fontFamily: fonts.regular, fontSize: 15.5, color: colors.ink1, borderWidth: 1, borderColor: colors.line },
  manualAdd: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 16, alignItems: 'center', marginTop: 4, ...shadow.button },
  manualAddDisabled: { backgroundColor: colors.chip, shadowOpacity: 0, elevation: 0 },
  manualAddText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  manualAddTextDisabled: { color: colors.ink3 },
});
