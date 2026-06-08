import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { ArrowIcon, BellIcon, PlayIcon, SearchIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { forceSync } from '../../lib/sync';
import type { ShelfBook } from '../../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';
const CREAM = '#FBF1DC';

function progressOf(b: ShelfBook): number {
  if (!b.pageCount) return 0;
  return Math.min((b.shelf.currentPage ?? 0) / b.pageCount, 1);
}

// ── 3D hero book that tilts with the phone (parallax via accelerometer) ─────
function HeroBook({ book, pct }: { book: ShelfBook; pct: number }) {
  // roll = left/right tilt, pitch = forward/back tilt, both re-centred to
  // however the phone is being held when the screen mounts.
  const roll = useRef(new Animated.Value(0)).current;
  const pitch = useRef(new Animated.Value(0)).current;
  const base = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let sub: ReturnType<typeof Accelerometer.addListener> | undefined;
    let active = true;
    (async () => {
      const ok = await Accelerometer.isAvailableAsync().catch(() => false);
      if (!ok || !active) return;
      Accelerometer.setUpdateInterval(60);
      sub = Accelerometer.addListener(({ x, y }) => {
        if (!base.current) base.current = { x, y };
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        const dx = clamp((x - base.current.x) * 1.6);
        const dy = clamp((y - base.current.y) * 1.6);
        Animated.timing(roll, { toValue: dx, duration: 90, useNativeDriver: true }).start();
        Animated.timing(pitch, { toValue: dy, duration: 90, useNativeDriver: true }).start();
      });
    })();
    return () => { active = false; sub?.remove(); };
  }, [roll, pitch]);

  // Neutral pose ≈ the original -13°/4° 3D look; tilt nudges around it.
  const rotateY = roll.interpolate({ inputRange: [-1, 1], outputRange: ['-33deg', '9deg'] });
  const rotateX = pitch.interpolate({ inputRange: [-1, 1], outputRange: ['16deg', '-8deg'] });

  return (
    <View style={ho.bookZone}>
      <View style={ho.bookShadow} />
      <Animated.View
        style={[ho.book3d, { transform: [{ perspective: 1400 }, { rotateY }, { rotateX }, { rotateZ: '-1deg' }] }]}
      >
        {book.coverUrl ? (
          <ExpoImage source={{ uri: book.coverUrl }} style={ho.bookCover} contentFit="cover" transition={220} cachePolicy="memory-disk" />
        ) : (
          <View style={[ho.bookCover, ho.bookCoverFallback]}>
            <Text style={ho.bookCoverFallbackText} numberOfLines={4}>{book.title.toUpperCase()}</Text>
          </View>
        )}
        {/* Spine shade (inset-left) */}
        <LinearGradient colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 0.28, y: 0.5 }} style={ho.bookSpine} />
        {/* Page edges on the right */}
        <View style={ho.bookPages} />
        {/* Sheen */}
        <LinearGradient colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0.45 }} style={ho.bookSheen} />
      </Animated.View>

      {/* Progress pill — high-contrast against the cover */}
      <View style={ho.pill}>
        <Text style={ho.pillText}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}

function MiniCover({ book }: { book: ShelfBook }) {
  if (book.coverUrl) {
    return <ExpoImage source={{ uri: book.coverUrl }} style={ho.miniBook} contentFit="cover" transition={220} cachePolicy="memory-disk" />;
  }
  return (
    <View style={[ho.miniBook, ho.miniFallback]}>
      <Text style={ho.miniFallbackText} numberOfLines={3}>{book.title.toUpperCase()}</Text>
    </View>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={ho.stat}>
      <Text style={ho.statEmoji}>{emoji}</Text>
      <Text style={ho.statValue}>{value}</Text>
      <Text style={ho.statLabel}>{label}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    forceSync(); // "back up now"; brief spinner so the gesture feels acknowledged
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const owned = useMemo(
    () =>
      Object.values(shelf)
        .filter((e) => e.status !== 'wishlist')
        .map((e) => ({ ...books[e.bookId], shelf: e }))
        .filter((b): b is ShelfBook => !!b.id),
    [books, shelf],
  );

  // Hero = the book they're currently reading, else the most recently added.
  const recent = useMemo(
    () => [...owned].sort((a, b) => new Date(b.shelf.addedAt).getTime() - new Date(a.shelf.addedAt).getTime()),
    [owned],
  );
  const reading = useMemo(
    () =>
      owned
        .filter((b) => b.shelf.status === 'reading')
        .sort((a, b) =>
          new Date(b.shelf.startedAt ?? b.shelf.addedAt).getTime() - new Date(a.shelf.startedAt ?? a.shelf.addedAt).getTime(),
        ),
    [owned],
  );
  const current = reading[0] ?? recent[0] ?? null;

  const readCount = owned.filter((b) => b.shelf.status === 'read').length;
  const miniBooks = recent.slice(0, 4);
  const more = owned.length - miniBooks.length;
  const pct = current ? progressOf(current) : 0;

  return (
    <ScrollView
      style={ho.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BROWN} colors={[AMBER]} />}
    >
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={ho.topbar}>
        <View style={ho.avatarWrap}>
          <Image source={require('../../assets/images/av_me.png')} style={ho.avatar} resizeMode="cover" />
          <View style={ho.soul}><Text style={ho.soulEmoji}>🦊</Text></View>
        </View>
        <View style={ho.topActions}>
          <TouchableOpacity style={ho.iconBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Notifications">
            <BellIcon color={INK} />
            <View style={ho.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity style={ho.iconBtn} activeOpacity={0.7} onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel="Search your library">
            <SearchIcon color={INK} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Greeting ─────────────────────────────────── */}
      <View style={ho.greeting}>
        <Text style={ho.greetingH1}>Good morning, Ross <Text style={ho.leaf}>🌿</Text></Text>
        <Text style={ho.streak}>📚 {owned.length} book{owned.length === 1 ? '' : 's'} in your library</Text>
      </View>

      {current ? (
        <>
          {/* ── Hero ─────────────────────────────────── */}
          <View style={ho.hero}>
            <HeroBook book={current} pct={pct} />
          </View>

          <TouchableOpacity
            style={ho.bookMeta}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: current.id } })}
          >
            <Text style={ho.bookTitle} numberOfLines={2}>{current.title}</Text>
            <Text style={ho.bookAuthor}>{current.author}</Text>
            {!!current.pageCount && (
              <Text style={ho.pages}>
                <Text style={ho.pagesStrong}>{current.shelf.currentPage ?? 0}</Text> / {current.pageCount} pages
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={ho.startBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: current.id } })}
          >
            <PlayIcon color={WHITE} />
            <Text style={ho.startBtnText}>Start Reading Session</Text>
          </TouchableOpacity>
        </>
      ) : (
        // ── Empty hero (no books yet) ───────────────
        <View style={ho.emptyHero}>
          <Text style={ho.emptyEmoji}>📚</Text>
          <Text style={ho.emptyTitle}>Your shelf is waiting</Text>
          <Text style={ho.emptyText}>Scan a book you own to start your library.</Text>
          <TouchableOpacity style={ho.startBtn} activeOpacity={0.85} onPress={() => router.navigate('/(tabs)/scan')}>
            <Text style={ho.startBtnText}>Scan a book  →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Quick stats ──────────────────────────────── */}
      <View style={ho.stats}>
        <Stat emoji="📚" value={String(owned.length)} label="In Library" />
        <Stat emoji="📖" value={String(reading.length)} label="Reading" />
        <Stat emoji="✅" value={String(readCount)} label="Books Read" />
      </View>

      {/* ── My Shelf card ────────────────────────────── */}
      <TouchableOpacity style={ho.bigCard} activeOpacity={0.85} onPress={() => router.navigate('/(tabs)/shelf')}>
        <View style={ho.bigCardHead}>
          <View>
            <Text style={ho.bigCardTitle}>My Shelf</Text>
            <Text style={ho.bigCardSub}>{owned.length} book{owned.length === 1 ? '' : 's'} in your library</Text>
          </View>
          <ArrowIcon color={MUTE} />
        </View>
        {miniBooks.length > 0 ? (
          <View style={ho.shelfRow}>
            {miniBooks.map((b) => <MiniCover key={b.id} book={b} />)}
            {more > 0 && <View style={ho.shelfMore}><Text style={ho.shelfMoreText}>+{more}</Text></View>}
          </View>
        ) : (
          <Text style={ho.shelfEmpty}>Nothing here yet — scan a book to begin.</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const ho = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F3' },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4 },
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
  bellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER, borderWidth: 1.5, borderColor: WHITE },

  // ── Greeting
  greeting: { paddingHorizontal: 20, paddingTop: 16 },
  greetingH1: { fontSize: 25, fontWeight: '800', letterSpacing: -0.4, color: INK },
  leaf: { fontWeight: '400' },
  streak: { marginTop: 5, fontSize: 14.5, fontWeight: '600', color: BROWN },

  // ── Hero
  hero: { height: 290, alignItems: 'center', justifyContent: 'center', marginTop: 12 },

  bookZone: { alignItems: 'center', justifyContent: 'center' },
  bookShadow: {
    position: 'absolute', bottom: -22, width: 130, height: 22, borderRadius: 60,
    backgroundColor: 'rgba(90,60,35,0.28)', opacity: 0.9, transform: [{ scaleX: 1.2 }],
  },
  book3d: { width: 152, height: 226 },
  bookCover: { position: 'absolute', top: 0, left: 0, width: 152, height: 226, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderTopRightRadius: 7, borderBottomRightRadius: 7, backgroundColor: '#2A2420' },
  bookCoverFallback: { alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#463353' },
  bookCoverFallbackText: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 15, lineHeight: 19, letterSpacing: 0.6, color: '#E8D9B5', textAlign: 'center' },
  bookSpine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 152, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  bookPages: {
    position: 'absolute', top: 3, bottom: 3, right: -11, width: 13, backgroundColor: '#EFE6D2',
    borderRadius: 2, transform: [{ perspective: 600 }, { rotateY: '40deg' }],
  },
  bookSheen: { position: 'absolute', top: 0, left: 0, width: 152, height: 226, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderTopRightRadius: 7, borderBottomRightRadius: 7 },

  // Progress pill — ink fill / cream text (high contrast vs any cover)
  pill: {
    position: 'absolute', top: 18, right: 36, backgroundColor: INK, borderRadius: 999,
    paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1.5, borderColor: CREAM,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  pillText: { color: CREAM, fontWeight: '800', fontSize: 14, letterSpacing: -0.2 },

  // ── Book meta
  bookMeta: { alignItems: 'center', marginTop: 2, paddingHorizontal: 30 },
  bookTitle: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 21, color: INK, letterSpacing: 0.1, textAlign: 'center' },
  bookAuthor: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, color: MUTE, marginTop: 1 },
  pages: { fontSize: 12.5, fontWeight: '600', color: BROWN, marginTop: 6 },
  pagesStrong: { color: INK, fontWeight: '800' },

  // ── Start button
  startBtn: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6,
    paddingVertical: 14, paddingHorizontal: 26, borderRadius: 999, backgroundColor: AMBER,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  startBtnText: { color: WHITE, fontWeight: '800', fontSize: 15.5, letterSpacing: 0.1 },

  // ── Empty hero
  emptyHero: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontFamily: 'Georgia', fontSize: 21, fontWeight: '600', color: INK },
  emptyText: { fontSize: 14.5, fontWeight: '500', color: MUTE, textAlign: 'center', marginTop: 8 },

  // ── Stats
  stats: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 18 },
  stat: {
    flex: 1, backgroundColor: WHITE, borderRadius: 18, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  statEmoji: { fontSize: 17 },
  statValue: { fontWeight: '800', fontSize: 21, color: INK, marginTop: 5, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', color: MUTE, marginTop: 2 },

  // ── Big cards
  bigCard: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: WHITE, borderRadius: 22, padding: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  bigCardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bigCardTitle: { fontWeight: '800', fontSize: 16.5, color: INK },
  bigCardSub: { fontSize: 12.5, fontWeight: '600', color: MUTE, marginTop: 2 },

  // Shelf row
  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  miniBook: {
    width: 44, height: 64, borderTopLeftRadius: 3, borderBottomLeftRadius: 3, borderTopRightRadius: 5, borderBottomRightRadius: 5,
    backgroundColor: '#2A2420',
    shadowColor: '#5A3C23', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.18, shadowRadius: 7, elevation: 2,
  },
  miniFallback: { alignItems: 'center', justifyContent: 'center', padding: 4, backgroundColor: '#463353' },
  miniFallbackText: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 7, lineHeight: 9, letterSpacing: 0.3, color: '#E8D9B5', textAlign: 'center' },
  shelfMore: {
    width: 44, height: 64, borderRadius: 5, backgroundColor: '#F6EFE2',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderStyle: 'dashed',
  },
  shelfMoreText: { color: BROWN, fontWeight: '800', fontSize: 14 },
  shelfEmpty: { fontSize: 13, fontWeight: '600', color: MUTE, marginTop: 14 },

  // Friends
  friendList: { gap: 12, marginTop: 14 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  friendAv: { width: 40, height: 40 },
  favatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: WHITE },
  fsoul: {
    position: 'absolute', right: -3, bottom: -3, width: 19, height: 19, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 2,
  },
  fsoulEmoji: { fontSize: 10 },
  friendTxt: { flex: 1, minWidth: 0 },
  friendName: { fontWeight: '700', fontSize: 14.5, color: INK },
  friendBook: { fontSize: 12.5, color: MUTE, fontWeight: '600' },
  friendBookEm: { fontStyle: 'italic', color: BROWN },
  friendPct: { fontWeight: '800', fontSize: 13, color: '#E29A2A', backgroundColor: '#FBF1DC', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9, overflow: 'hidden' },
});
