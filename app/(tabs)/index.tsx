import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AvatarFace } from '../../components/AvatarFace';
import { ArrowIcon, PlayIcon, SearchIcon } from '../../components/icons';
import { ProgressSheet } from '../../components/ProgressSheet';
import { ForYou } from '../../components/ForYou';
import { CountUp, PressableScale } from '../../components/anim';
import { ANIMALS } from '../../constants/animals';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import { useSessionsStore } from '../../store/sessionsStore';
import { currentStreak } from '../../lib/stats';
import { forceSync } from '../../lib/sync';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';
import type { ShelfBook } from '../../types/book';

// Fallback avatar if the builder was skipped (mirrors avatar.tsx / profile.tsx)
const DEFAULT_AVATAR = { skin: '#E8A87C', hairStyle: 1, hairColor: '#5C3317', shirtColor: '#232A33' };

function progressOf(b: ShelfBook): number {
  if (!b.pageCount) return 0;
  return Math.min((b.shelf.currentPage ?? 0) / b.pageCount, 1);
}

type HeroBadge = { text: string; tone: 'progress' | 'finished' | 'status' };

// A status-aware badge for the hero book — a real % only when there's genuine
// reading progress, otherwise a plain status label (never a misleading 0%).
function heroBadge(b: ShelfBook): HeroBadge | null {
  switch (b.shelf.status) {
    case 'reading':
      return b.pageCount && (b.shelf.currentPage ?? 0) > 0
        ? { text: `${Math.round(progressOf(b) * 100)}%`, tone: 'progress' }
        : { text: 'Reading', tone: 'status' };
    case 'read':
      return { text: 'Finished', tone: 'finished' };
    case 'want_to_read':
      return { text: 'Want to read', tone: 'status' };
    case 'did_not_finish':
      return { text: 'Didn’t finish', tone: 'status' };
    default:
      return null;
  }
}

// ── Flat hero cover with a readable progress pill ──────────────────────────
function HeroCover({ book, badge }: { book: ShelfBook; badge: HeroBadge | null }) {
  return (
    <View style={ho.heroWrap}>
      {book.coverUrl ? (
        <ExpoImage source={{ uri: book.coverUrl }} style={ho.heroCover} contentFit="cover" transition={220} cachePolicy="memory-disk" />
      ) : (
        <View style={[ho.heroCover, ho.heroFallback]}>
          <Text style={ho.heroFallbackText} numberOfLines={5}>{book.title}</Text>
        </View>
      )}
      {badge && (
        <View style={[ho.pill, badge.tone === 'finished' && ho.pillFinished, badge.tone === 'status' && ho.pillStatus]}>
          <Text style={[ho.pillText, badge.tone === 'finished' && ho.pillTextFinished, badge.tone === 'status' && ho.pillTextStatus]}>
            {badge.text}
          </Text>
        </View>
      )}
    </View>
  );
}

function MiniCover({ book }: { book: ShelfBook }) {
  if (book.coverUrl) {
    return <ExpoImage source={{ uri: book.coverUrl }} style={ho.miniBook} contentFit="cover" transition={220} cachePolicy="memory-disk" />;
  }
  return (
    <View style={[ho.miniBook, ho.miniFallback]}>
      <Text style={ho.miniFallbackText} numberOfLines={3}>{book.title}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={ho.stat}>
      <CountUp to={value} duration={900} style={ho.statValue} />
      <Text style={ho.statLabel}>{label}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const updateShelfEntry = useBookshelfStore((s) => s.updateShelfEntry);
  const sessions = useSessionsStore((s) => s.sessions);
  const readingStreak = useMemo(() => currentStreak(sessions), [sessions]);
  const profile = useUserStore((s) => s.profile);
  const [refreshing, setRefreshing] = useState(false);
  const [progressBook, setProgressBook] = useState<ShelfBook | null>(null);

  const av = profile.avatar ?? DEFAULT_AVATAR;
  const soulEmoji = (ANIMALS.find((a) => a.name === profile.soulAnimal) ?? ANIMALS.find((a) => a.name === 'Fox')!).emoji;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    forceSync();
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

  const recent = useMemo(
    () => [...owned].sort((a, b) => new Date(b.shelf.addedAt).getTime() - new Date(a.shelf.addedAt).getTime()),
    [owned],
  );
  const reading = useMemo(
    () =>
      owned
        .filter((b) => b.shelf.status === 'reading')
        .sort((a, b) => new Date(b.shelf.startedAt ?? b.shelf.addedAt).getTime() - new Date(a.shelf.startedAt ?? a.shelf.addedAt).getTime()),
    [owned],
  );
  const toRead = useMemo(
    () =>
      owned
        .filter((b) => b.shelf.status === 'want_to_read')
        .sort((a, b) => new Date(b.shelf.addedAt).getTime() - new Date(a.shelf.addedAt).getTime()),
    [owned],
  );
  const current = reading[0] ?? toRead[0] ?? recent[0] ?? null;
  const isReading = current?.shelf.status === 'reading';
  const badge = current ? heroBadge(current) : null;

  const readCount = owned.filter((b) => b.shelf.status === 'read').length;
  const miniBooks = recent.slice(0, 4);
  const more = owned.length - miniBooks.length;

  const openBook = (id: string) => router.push({ pathname: '/book/[id]', params: { id } });
  // Primary action = start a focus reading session (the timer). Quick page-only
  // updates stay available via the "Just update my page" link below.
  const onHeroCta = () => {
    if (!current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/reading', params: { id: current.id } });
  };
  const ctaLabel = isReading ? 'Continue reading' : current?.shelf.status === 'read' ? 'Read it again' : 'Start reading';

  return (
    <>
    <ScrollView
      style={ho.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink3} />}
    >
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={ho.topbar}>
        <View style={ho.avatarWrap}>
          <View style={ho.avatar}>
            <AvatarFace skin={av.skin} hairStyle={av.hairStyle} hairColor={av.hairColor} shirtColor={av.shirtColor} size={42} />
          </View>
          <View style={ho.soul}><Text style={ho.soulEmoji}>{soulEmoji}</Text></View>
        </View>
        <TouchableOpacity style={ho.iconBtn} activeOpacity={0.7} onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel="Search your library">
          <SearchIcon color={colors.ink1} />
        </TouchableOpacity>
      </View>

      {/* ── Greeting ─────────────────────────────────── */}
      <View style={ho.greeting}>
        <Text style={ho.greetingH1}>{greet}{profile.username ? `, ${profile.username}` : ''}</Text>
        <Text style={ho.streak}>{owned.length} book{owned.length === 1 ? '' : 's'} in your library</Text>
        {readingStreak > 0 && (
          <PressableScale style={ho.streakPill} onPress={() => { Haptics.selectionAsync(); router.push('/stats'); }}>
            <Text style={ho.streakPillText}>🔥 {readingStreak} day reading streak</Text>
          </PressableScale>
        )}
      </View>

      {current ? (
        <>
          {/* ── Hero (flat cover + pill) ──────────────── */}
          <View style={ho.hero}>
            <PressableScale onPress={() => openBook(current.id)}>
              <HeroCover book={current} badge={badge} />
            </PressableScale>
          </View>

          <TouchableOpacity style={ho.bookMeta} activeOpacity={0.7} onPress={() => openBook(current.id)}>
            <Text style={ho.bookTitle} numberOfLines={2}>{current.title}</Text>
            <Text style={ho.bookAuthor}>{current.author}</Text>
            {isReading && !!current.pageCount ? (
              <Text style={ho.pages}><Text style={ho.pagesStrong}>{current.shelf.currentPage ?? 0}</Text> / {current.pageCount} pages</Text>
            ) : !!current.pageCount ? (
              <Text style={ho.pages}>{current.pageCount} pages</Text>
            ) : null}
          </TouchableOpacity>

          <PressableScale style={ho.startBtn} onPress={onHeroCta}>
            {!isReading && <PlayIcon color={colors.accentText} />}
            <Text style={ho.startBtnText}>{ctaLabel}</Text>
          </PressableScale>
          {isReading && (
            <TouchableOpacity style={ho.updateLink} onPress={() => setProgressBook(current)} activeOpacity={0.7}>
              <Text style={ho.updateLinkText}>Just update my page</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        // ── Empty hero (no books yet) ───────────────
        <View style={ho.emptyHero}>
          <Text style={ho.emptyEmoji}>📚</Text>
          <Text style={ho.emptyTitle}>Your shelf is waiting</Text>
          <Text style={ho.emptyText}>Scan a book you own to start your library.</Text>
          <PressableScale style={ho.startBtn} onPress={() => router.navigate('/(tabs)/scan')}>
            <Text style={ho.startBtnText}>Scan a book</Text>
          </PressableScale>
        </View>
      )}

      {/* ── Quick stats (tap → reading life) ─────────── */}
      <PressableScale style={ho.stats} onPress={() => { Haptics.selectionAsync(); router.push('/stats'); }}>
        <Stat value={owned.length} label="In Library" />
        <Stat value={reading.length} label="Reading" />
        <Stat value={readCount} label="Books Read" />
      </PressableScale>

      {/* ── My Shelf card ────────────────────────────── */}
      <PressableScale style={ho.bigCard} onPress={() => router.navigate('/(tabs)/shelf')}>
        <View style={ho.bigCardHead}>
          <View>
            <Text style={ho.bigCardTitle}>My Shelf</Text>
            <Text style={ho.bigCardSub}>{owned.length} book{owned.length === 1 ? '' : 's'} in your library</Text>
          </View>
          <ArrowIcon color={colors.ink3} />
        </View>
        {miniBooks.length > 0 ? (
          <View style={ho.shelfRow}>
            {miniBooks.map((b) => <MiniCover key={b.id} book={b} />)}
            {more > 0 && <View style={ho.shelfMore}><Text style={ho.shelfMoreText}>+{more}</Text></View>}
          </View>
        ) : (
          <Text style={ho.shelfEmpty}>Nothing here yet — scan a book to begin.</Text>
        )}
      </PressableScale>

      {/* ── For you (quiet recommendation teaser → Shelf) ─────────────── */}
      <ForYou variant="teaser" />
    </ScrollView>
    <ProgressSheet book={progressBook} visible={!!progressBook} onClose={() => setProgressBook(null)} />
    </>
  );
}

const ho = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 4 },
  avatarWrap: { width: 46, height: 46 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: colors.card, ...shadow.cardSoft },
  soul: { position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.cardSoft },
  soulEmoji: { fontSize: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },

  // ── Greeting
  greeting: { paddingHorizontal: 22, paddingTop: 16 },
  greetingH1: { fontFamily: fonts.semibold, ...ty.titleSm, color: colors.ink1 },
  streak: { marginTop: 5, fontFamily: fonts.medium, ...ty.body, color: colors.ink2 },
  streakPill: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  streakPillText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink1 },
  updateLink: { alignSelf: 'center', marginTop: 12, paddingVertical: 4 },
  updateLinkText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },

  // ── Hero
  hero: { alignItems: 'center', justifyContent: 'center', marginTop: 22, marginBottom: 4 },
  heroWrap: { width: 172, height: 258 },
  heroCover: { width: 172, height: 258, borderRadius: 10, backgroundColor: colors.chip, shadowColor: '#2A2017', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 26, elevation: 10 },
  heroFallback: { alignItems: 'center', justifyContent: 'center', padding: 18 },
  heroFallbackText: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.ink1, textAlign: 'center' },

  // Progress pill — high contrast on any cover
  pill: { position: 'absolute', top: 10, right: 10, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, ...shadow.cardSoft },
  pillText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.accentText, letterSpacing: -0.2 },
  pillFinished: { backgroundColor: colors.success },
  pillTextFinished: { color: '#FFFFFF' },
  pillStatus: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  pillTextStatus: { color: colors.ink1 },

  // ── Book meta
  bookMeta: { alignItems: 'center', marginTop: 18, paddingHorizontal: 30 },
  bookTitle: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1, textAlign: 'center' },
  bookAuthor: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.ink2, marginTop: 3 },
  pages: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink2, marginTop: 8 },
  pagesStrong: { fontFamily: fonts.semibold, color: colors.ink1 },

  // ── Start button
  startBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 6, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 999, backgroundColor: colors.accent, ...shadow.button },
  startBtnText: { color: colors.accentText, fontFamily: fonts.semibold, fontSize: 15.5 },

  // ── Empty hero
  emptyHero: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1 },
  emptyText: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, textAlign: 'center', marginTop: 8 },

  // ── Stats
  stats: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: 22 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.card, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  statValue: { fontFamily: fonts.semibold, ...ty.stat, color: colors.ink1 },
  statLabel: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 3 },

  // ── My Shelf card
  bigCard: { marginHorizontal: 22, marginTop: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  bigCardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bigCardTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  bigCardSub: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 3 },

  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  miniBook: { width: 46, height: 69, borderRadius: 5, backgroundColor: colors.chip },
  miniFallback: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  miniFallbackText: { fontFamily: fonts.semibold, fontSize: 7.5, lineHeight: 9, color: colors.ink2, textAlign: 'center' },
  shelfMore: { width: 46, height: 69, borderRadius: 5, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  shelfMoreText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink2 },
  shelfEmpty: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink3, marginTop: 14 },
});
