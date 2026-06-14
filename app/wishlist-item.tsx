import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BookCover } from '../components/BookCover';
import { HeartIcon } from '../components/icons';
import { useBookshelfStore } from '../store/bookshelfStore';
import { useUserStore } from '../store/userStore';
import { shelfChipColor } from '../constants/shelfColors';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

function Chevron() {
  return (
    <View style={wi.chevronWrap}>
      <View style={wi.chevronArm1} />
      <View style={wi.chevronArm2} />
    </View>
  );
}

export default function WishlistItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBookshelfStore((s) => s.books[id]);
  const entry = useBookshelfStore((s) => s.shelf[id]);
  const updateShelfEntry = useBookshelfStore((s) => s.updateShelfEntry);
  const toggleBookShelf = useBookshelfStore((s) => s.toggleBookShelf);
  const removeFromShelf = useBookshelfStore((s) => s.removeFromShelf);
  const shelfDefs = useUserStore((s) => s.profile.shelves) ?? [];

  const [picking, setPicking] = useState(false);

  if (!book || !entry) {
    return (
      <SafeAreaView style={wi.safe}>
        <View style={wi.topbar}>
          <TouchableOpacity style={wi.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back"><Chevron /></TouchableOpacity>
        </View>
        <View style={wi.missing}><Text style={wi.missingText}>This book isn’t on your wishlist anymore.</Text></View>
      </SafeAreaView>
    );
  }

  const meta = [book.publishedYear, book.pageCount ? `${book.pageCount} pages` : null].filter(Boolean).join(' · ');

  const moveToLibrary = (shelfName?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateShelfEntry(id, { status: 'want_to_read' });
    if (shelfName && !(entry.shelves ?? []).includes(shelfName)) toggleBookShelf(id, shelfName);
    router.back();
  };

  const onAddToShelf = () => {
    if (shelfDefs.length > 1) { setPicking(true); return; }
    moveToLibrary(shelfDefs[0]?.name);
  };

  const removeFromWishlist = () => { removeFromShelf(id); router.back(); };

  return (
    <SafeAreaView style={wi.safe}>
      <View style={wi.topbar}>
        <TouchableOpacity style={wi.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back"><Chevron /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={wi.content} showsVerticalScrollIndicator={false}>
        <View style={wi.hero}>
          <View style={wi.cover}><BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} /></View>
          <View style={wi.wishTag}>
            <HeartIcon color={colors.ink2} size={14} fill={colors.ink2} />
            <Text style={wi.wishTagText}>On your wishlist</Text>
          </View>
          <Text style={wi.title}>{book.title}</Text>
          <Text style={wi.author}>{book.author}</Text>
          {!!meta && <Text style={wi.meta}>{meta}</Text>}
        </View>

        {!!book.description && <Text style={wi.desc} numberOfLines={8}>{book.description}</Text>}

        {!picking ? (
          <>
            <TouchableOpacity style={wi.cta} onPress={onAddToShelf} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel="Add to my shelf">
              <Text style={wi.ctaText}>Add to my shelf</Text>
            </TouchableOpacity>
            <Text style={wi.ctaHint}>
              Got it now? This moves it into your library{shelfDefs.length > 1 ? ' on a shelf you choose' : shelfDefs.length === 1 ? ` on ${shelfDefs[0].emoji} ${shelfDefs[0].name}` : ''}.
            </Text>
            <TouchableOpacity style={wi.remove} onPress={removeFromWishlist} activeOpacity={0.7}><Text style={wi.removeText}>Remove from wishlist</Text></TouchableOpacity>
          </>
        ) : (
          <View style={wi.picker}>
            <Text style={wi.pickerTitle}>Add to which shelf?</Text>
            {shelfDefs.map((sh) => (
              <TouchableOpacity key={sh.name} style={wi.shelfRow} onPress={() => moveToLibrary(sh.name)} activeOpacity={0.8}>
                <View style={[wi.dot, { backgroundColor: shelfChipColor(sh.color) }]}><Text style={wi.dotEmoji}>{sh.emoji}</Text></View>
                <Text style={wi.shelfName}>{sh.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={wi.shelfRow} onPress={() => moveToLibrary(undefined)} activeOpacity={0.8}>
              <View style={[wi.dot, { backgroundColor: colors.chip }]}><Text style={wi.dotEmoji}>📚</Text></View>
              <Text style={wi.shelfName}>Just my library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={wi.cancel} onPress={() => setPicking(false)} activeOpacity={0.7}><Text style={wi.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const wi = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  content: { paddingHorizontal: 22, paddingBottom: 40 },

  hero: { alignItems: 'center', marginTop: 8 },
  cover: { width: 130, marginBottom: 14 },
  wishTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.chip, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 12 },
  wishTagText: { fontFamily: fonts.semibold, ...ty.caption, color: colors.ink2 },
  title: { fontFamily: fonts.semibold, ...ty.title, color: colors.ink1, textAlign: 'center' },
  author: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.ink2, marginTop: 6 },
  meta: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 6 },

  desc: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink2, marginTop: 22 },

  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', marginTop: 28, ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  ctaHint: { fontFamily: fonts.regular, ...ty.caption, color: colors.ink3, textAlign: 'center', marginTop: 12 },

  remove: { alignSelf: 'center', marginTop: 24, paddingVertical: 10, paddingHorizontal: 20 },
  removeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },

  picker: { marginTop: 26, gap: 10 },
  pickerTitle: { fontFamily: fonts.medium, ...ty.eyebrow, textTransform: 'uppercase', color: colors.ink3, marginBottom: 4 },
  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.card, padding: 12, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  dot: { width: 40, height: 40, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  dotEmoji: { fontSize: 19 },
  shelfName: { flex: 1, fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  cancel: { alignSelf: 'center', marginTop: 8, paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink3 },

  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  missingText: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3, textAlign: 'center' },
});
