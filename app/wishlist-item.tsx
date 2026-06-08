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

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';
const RED   = '#E0506B';

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
          <TouchableOpacity style={wi.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
            <Chevron />
          </TouchableOpacity>
        </View>
        <View style={wi.missing}><Text style={wi.missingText}>This book isn’t on your wishlist anymore.</Text></View>
      </SafeAreaView>
    );
  }

  const meta = [book.publishedYear, book.pageCount ? `${book.pageCount} pages` : null].filter(Boolean).join(' · ');

  // Move the book out of the wishlist and into the owned library, optionally
  // filing it onto a chosen shelf, then return to the Wishlist tab.
  const moveToLibrary = (shelfName?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateShelfEntry(id, { status: 'want_to_read' });
    if (shelfName && !(entry.shelves ?? []).includes(shelfName)) toggleBookShelf(id, shelfName);
    router.back();
  };

  const onAddToShelf = () => {
    // 0 shelves → straight to the library; exactly 1 → that shelf; >1 → ask.
    if (shelfDefs.length > 1) {
      setPicking(true);
      return;
    }
    moveToLibrary(shelfDefs[0]?.name);
  };

  const removeFromWishlist = () => {
    removeFromShelf(id);
    router.back();
  };

  return (
    <SafeAreaView style={wi.safe}>
      <View style={wi.topbar}>
        <TouchableOpacity style={wi.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
          <Chevron />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={wi.content} showsVerticalScrollIndicator={false}>
        {/* ── Hero ───────────────────────────────────── */}
        <View style={wi.hero}>
          <View style={wi.cover}>
            <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} />
          </View>
          <View style={wi.wishTag}>
            <HeartIcon color="#C0851E" size={14} fill="#C0851E" />
            <Text style={wi.wishTagText}>On your wishlist</Text>
          </View>
          <Text style={wi.title}>{book.title}</Text>
          <Text style={wi.author}>{book.author}</Text>
          {!!meta && <Text style={wi.meta}>{meta}</Text>}
        </View>

        {!!book.description && <Text style={wi.desc} numberOfLines={8}>{book.description}</Text>}

        {!picking ? (
          <>
            {/* ── Primary action ───────────────────────── */}
            <TouchableOpacity style={wi.cta} onPress={onAddToShelf} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Add to my shelf">
              <Text style={wi.ctaText}>Add to my shelf  →</Text>
            </TouchableOpacity>
            <Text style={wi.ctaHint}>
              Got it now? This moves it into your library{shelfDefs.length > 1 ? ' on a shelf you choose' : shelfDefs.length === 1 ? ` on ${shelfDefs[0].emoji} ${shelfDefs[0].name}` : ''}.
            </Text>

            <TouchableOpacity style={wi.remove} onPress={removeFromWishlist} activeOpacity={0.7}>
              <Text style={wi.removeText}>Remove from wishlist</Text>
            </TouchableOpacity>
          </>
        ) : (
          // ── Shelf picker (only when more than one shelf) ──
          <View style={wi.picker}>
            <Text style={wi.pickerTitle}>Add to which shelf?</Text>
            {shelfDefs.map((sh) => (
              <TouchableOpacity key={sh.name} style={wi.shelfRow} onPress={() => moveToLibrary(sh.name)} activeOpacity={0.8}>
                <View style={[wi.dot, { backgroundColor: shelfChipColor(sh.color) }]}><Text style={wi.dotEmoji}>{sh.emoji}</Text></View>
                <Text style={wi.shelfName}>{sh.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={wi.shelfRow} onPress={() => moveToLibrary(undefined)} activeOpacity={0.8}>
              <View style={[wi.dot, { backgroundColor: '#F6EFE2' }]}><Text style={wi.dotEmoji}>📚</Text></View>
              <Text style={wi.shelfName}>Just my library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={wi.cancel} onPress={() => setPicking(false)} activeOpacity={0.7}>
              <Text style={wi.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const wi = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  content: { paddingHorizontal: 22, paddingBottom: 40 },

  // ── Hero
  hero: { alignItems: 'center', marginTop: 8 },
  cover: { width: 130, marginBottom: 14 },
  wishTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FBEACB', borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 12, marginBottom: 12,
  },
  wishTagText: { fontSize: 12.5, fontWeight: '800', color: '#C0851E' },
  title: { fontFamily: 'Georgia', fontSize: 23, fontWeight: '600', color: INK, textAlign: 'center', lineHeight: 28 },
  author: { fontSize: 14, fontWeight: '700', color: BROWN, marginTop: 6 },
  meta: { fontSize: 12.5, fontWeight: '600', color: MUTE, marginTop: 6 },

  desc: { fontSize: 14.5, fontWeight: '500', color: '#463E33', lineHeight: 21, marginTop: 22 },

  // ── Primary CTA
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 28,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 16.5, fontWeight: '800', letterSpacing: 0.2 },
  ctaHint: { fontSize: 12.5, fontWeight: '500', color: MUTE, textAlign: 'center', marginTop: 12, lineHeight: 18 },

  remove: { alignSelf: 'center', marginTop: 24, paddingVertical: 10, paddingHorizontal: 20 },
  removeText: { fontSize: 14, fontWeight: '700', color: RED },

  // ── Shelf picker
  picker: { marginTop: 26, gap: 10 },
  pickerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: '#B08A52', marginBottom: 4 },
  shelfRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 16, padding: 12,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  dot: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotEmoji: { fontSize: 19 },
  shelfName: { flex: 1, fontSize: 15.5, fontWeight: '800', color: INK },
  cancel: { alignSelf: 'center', marginTop: 8, paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { fontSize: 14, fontWeight: '700', color: MUTE },

  // ── Missing
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  missingText: { fontSize: 15, fontWeight: '600', color: MUTE, textAlign: 'center' },
});
