import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBookshelfStore } from '../store/bookshelfStore';
import { searchBooks, openLibraryCoverUrl, coverExists } from '../lib/bookLookup';
import { uploadCover, deleteCover } from '../lib/coverStorage';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';
const RED   = '#E0506B';

const COVER_OPTS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.7 };

export default function ChangeCoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBookshelfStore((s) => s.books[id]);
  const setBookCover = useBookshelfStore((s) => s.setBookCover);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const current = book?.coverUrl;

  // Gather + verify candidate covers (Google editions + Open Library by ISBN).
  useEffect(() => {
    let active = true;
    (async () => {
      if (!book) {
        setLoading(false);
        return;
      }
      const discovered = new Set<string>();
      if (book.isbn) discovered.add(openLibraryCoverUrl(book.isbn));
      const results = await searchBooks(book.title);
      results.forEach((r) => r.coverUrl && discovered.add(r.coverUrl));
      if (current) discovered.delete(current);

      const list = Array.from(discovered);
      const checks = await Promise.all(list.map((u) => coverExists(u)));
      const ok = list.filter((_, i) => checks[i]);
      if (active) {
        setCandidates([...(current ? [current] : []), ...ok]);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const pick = (url: string) => {
    setBookCover(id, url);
    router.back();
  };

  const photo = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(COVER_OPTS)
      : await ImagePicker.launchImageLibraryAsync(COVER_OPTS);
    if (res.canceled) return;
    // Upload to Storage so the cover persists across devices; falls back to the
    // local uri when signed out or if the upload fails (local-first).
    setUploading(true);
    const url = await uploadCover(res.assets[0].uri, id);
    setBookCover(id, url);
    router.back();
  };

  const removeCover = () => {
    setBookCover(id, undefined);
    deleteCover(id); // best-effort cloud cleanup
    router.back();
  };

  return (
    <SafeAreaView style={cc.safe}>
      <View style={cc.topbar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={cc.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={cc.topTitle}>Change cover</Text>
        <View style={{ width: 56 }} />
      </View>

      {!book ? (
        <View style={cc.center}><Text style={cc.muted}>Book not found.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={cc.content} showsVerticalScrollIndicator={false}>
          {/* Photo of their own copy — best for special editions */}
          <View style={cc.photoRow}>
            <TouchableOpacity style={cc.photoBtn} onPress={() => photo(true)} disabled={uploading} activeOpacity={0.85}>
              <Text style={cc.photoBtnText}>📷  Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cc.photoBtn} onPress={() => photo(false)} disabled={uploading} activeOpacity={0.85}>
              <Text style={cc.photoBtnText}>🖼  Choose photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={cc.hint}>Got a special edition? A photo of your actual copy looks best.</Text>

          <Text style={cc.sectionLabel}>Pick a cover</Text>
          {loading ? (
            <View style={cc.center}><ActivityIndicator color={AMBER} /><Text style={cc.muted}>Finding covers…</Text></View>
          ) : candidates.length === 0 ? (
            <Text style={cc.muted}>No covers found online — use a photo above.</Text>
          ) : (
            <View style={cc.grid}>
              {candidates.map((url, i) => {
                const isCurrent = url === current;
                return (
                  <TouchableOpacity key={`${i}:${url}`} style={cc.tile} onPress={() => pick(url)} activeOpacity={0.85}>
                    <Image source={{ uri: url }} style={cc.tileImg} resizeMode="cover" />
                    {isCurrent && <View style={cc.currentBadge}><Text style={cc.currentText}>Current</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {current && (
            <TouchableOpacity style={cc.remove} onPress={removeCover} activeOpacity={0.7}>
              <Text style={cc.removeText}>Remove cover</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {uploading && (
        <View style={cc.overlay}>
          <ActivityIndicator color={AMBER} size="large" />
          <Text style={cc.overlayText}>Saving cover…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const cc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  cancel: { fontSize: 15, fontWeight: '700', color: MUTE, width: 56 },
  topTitle: { fontSize: 16, fontWeight: '800', color: INK },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  muted: { fontSize: 14, fontWeight: '600', color: MUTE },

  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1, alignItems: 'center', backgroundColor: WHITE, borderRadius: 14, paddingVertical: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.14)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  photoBtnText: { fontSize: 14.5, fontWeight: '800', color: INK },
  hint: { fontSize: 12.5, fontWeight: '500', color: MUTE, marginTop: 10, lineHeight: 18 },

  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: '#B08A52', marginTop: 26, marginBottom: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '30%', aspectRatio: 2 / 3, borderRadius: 6, overflow: 'hidden', backgroundColor: '#2A2420',
    shadowColor: '#5A3C23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  tileImg: { width: '100%', height: '100%' },
  currentBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(51,44,36,0.85)', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  currentText: { fontSize: 10, fontWeight: '800', color: WHITE },

  remove: { alignSelf: 'center', marginTop: 26, paddingVertical: 10, paddingHorizontal: 20 },
  removeText: { fontSize: 14, fontWeight: '700', color: RED },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250,248,243,0.86)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  overlayText: { fontSize: 14.5, fontWeight: '700', color: BROWN },
});
