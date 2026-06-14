import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useBookshelfStore } from '../store/bookshelfStore';
import { searchBooks, openLibraryCoverUrl, coverExists } from '../lib/bookLookup';
import { uploadCover, deleteCover } from '../lib/coverStorage';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

const COVER_OPTS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.7 };

export default function ChangeCoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBookshelfStore((s) => s.books[id]);
  const setBookCover = useBookshelfStore((s) => s.setBookCover);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const current = book?.coverUrl;

  useEffect(() => {
    let active = true;
    (async () => {
      if (!book) { setLoading(false); return; }
      const discovered = new Set<string>();
      if (book.isbn) discovered.add(openLibraryCoverUrl(book.isbn));
      const results = await searchBooks(book.title);
      results.forEach((r) => r.coverUrl && discovered.add(r.coverUrl));
      if (current) discovered.delete(current);
      const list = Array.from(discovered);
      const checks = await Promise.all(list.map((u) => coverExists(u)));
      const ok = list.filter((_, i) => checks[i]);
      if (active) { setCandidates([...(current ? [current] : []), ...ok]); setLoading(false); }
    })();
    return () => { active = false; };
  }, [id]);

  const pick = (url: string) => { setBookCover(id, url); router.back(); };

  const photo = async (fromCamera: boolean) => {
    if (fromCamera) { const perm = await ImagePicker.requestCameraPermissionsAsync(); if (!perm.granted) return; }
    const res = fromCamera ? await ImagePicker.launchCameraAsync(COVER_OPTS) : await ImagePicker.launchImageLibraryAsync(COVER_OPTS);
    if (res.canceled) return;
    setUploading(true);
    const url = await uploadCover(res.assets[0].uri, id);
    setBookCover(id, url);
    router.back();
  };

  const removeCover = () => { setBookCover(id, undefined); deleteCover(id); router.back(); };

  return (
    <SafeAreaView style={cc.safe}>
      <View style={cc.topbar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}><Text style={cc.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={cc.topTitle}>Change cover</Text>
        <View style={{ width: 56 }} />
      </View>

      {!book ? (
        <View style={cc.center}><Text style={cc.muted}>Book not found.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={cc.content} showsVerticalScrollIndicator={false}>
          <View style={cc.photoRow}>
            <TouchableOpacity style={cc.photoBtn} onPress={() => photo(true)} disabled={uploading} activeOpacity={0.85}><Text style={cc.photoBtnText}>📷  Take photo</Text></TouchableOpacity>
            <TouchableOpacity style={cc.photoBtn} onPress={() => photo(false)} disabled={uploading} activeOpacity={0.85}><Text style={cc.photoBtnText}>🖼  Choose photo</Text></TouchableOpacity>
          </View>
          <Text style={cc.hint}>Got a special edition? A photo of your actual copy looks best.</Text>

          <Text style={cc.sectionLabel}>Pick a cover</Text>
          {loading ? (
            <View style={cc.center}><ActivityIndicator color={colors.ink3} /><Text style={cc.muted}>Finding covers…</Text></View>
          ) : candidates.length === 0 ? (
            <Text style={cc.muted}>No covers found online — use a photo above.</Text>
          ) : (
            <View style={cc.grid}>
              {candidates.map((url, i) => {
                const isCurrent = url === current;
                return (
                  <TouchableOpacity key={`${i}:${url}`} style={cc.tile} onPress={() => pick(url)} activeOpacity={0.85}>
                    <Image source={{ uri: url }} style={cc.tileImg} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                    {isCurrent && <View style={cc.currentBadge}><Text style={cc.currentText}>Current</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {current && (
            <TouchableOpacity style={cc.remove} onPress={removeCover} activeOpacity={0.7}><Text style={cc.removeText}>Remove cover</Text></TouchableOpacity>
          )}
        </ScrollView>
      )}

      {uploading && (
        <View style={cc.overlay}>
          <ActivityIndicator color={colors.ink1} size="large" />
          <Text style={cc.overlayText}>Saving cover…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const cc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  cancel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink3, width: 56 },
  topTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink1 },

  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  muted: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3 },

  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.card, paddingVertical: 16, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  photoBtnText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink1 },
  hint: { fontFamily: fonts.regular, ...ty.caption, color: colors.ink3, marginTop: 10 },

  sectionLabel: { fontFamily: fonts.medium, ...ty.eyebrow, textTransform: 'uppercase', color: colors.ink3, marginTop: 26, marginBottom: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '30%', aspectRatio: 2 / 3, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.chip, ...shadow.cardSoft },
  tileImg: { width: '100%', height: '100%' },
  currentBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(42,38,34,0.85)', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  currentText: { fontFamily: fonts.semibold, fontSize: 10, color: '#FFFFFF' },

  remove: { alignSelf: 'center', marginTop: 26, paddingVertical: 10, paddingHorizontal: 20 },
  removeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(250,248,244,0.86)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  overlayText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },
});
