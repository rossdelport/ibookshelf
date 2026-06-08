import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AvatarFace } from '../../components/AvatarFace';
import { GearIcon, LockIcon, SparkIcon } from '../../components/icons';
import { ANIMALS } from '../../constants/animals';
import { useUserStore } from '../../store/userStore';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { supabase } from '../../lib/supabase';
import { useMemo } from 'react';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const WHITE = '#FFFFFF';

// Fallback appearance if the avatar builder was skipped (mirrors avatar.tsx defaults)
const DEFAULT_AVATAR = { skin: '#E8A87C', hairStyle: 1, hairColor: '#5C3317' };
const HAIR_STYLE_NAMES = ['Short crop', 'Curly', 'Wavy', 'Long', 'Bun', 'Shaved'];

// Three evocative traits per soul (extends the ANIMALS descriptions)
const TRAITS: Record<string, string[]> = {
  Dragon:  ['Ambitious', 'Imaginative', 'Devoted'],
  Wolf:    ['Independent', 'Intense', 'Loyal'],
  Eagle:   ['Observant', 'Sharp', 'Clear-eyed'],
  Deer:    ['Gentle', 'Tender', 'Patient'],
  Fox:     ['Curious', 'Quick-witted', 'Mischievous'],
  Owl:     ['Wise', 'Deliberate', 'Nocturnal'],
  Raven:   ['Perceptive', 'Mysterious', 'Romantic'],
  Panther: ['Focused', 'Patient', 'Relentless'],
  Phoenix: ['Hopeful', 'Reflective', 'Reborn'],
  Griffin: ['Principled', 'Passionate', 'Noble'],
};

const AURAS: { name: string; colors: [string, string]; locked: boolean }[] = [
  { name: 'Amber',    colors: ['#FBEACB', '#EFC471'], locked: false },
  { name: 'Silver',   colors: ['#EEF1F5', '#B7BEC9'], locked: true },
  { name: 'Golden',   colors: ['#FBE39E', '#E0A92E'], locked: true },
  { name: 'Obsidian', colors: ['#4A4754', '#1E1B24'], locked: true },
];

const GENRES: [string, string][] = [
  ['📖', 'Fantasy'], ['💕', 'Romance'], ['🚀', 'Sci-Fi'], ['🌿', 'Cosy'], ['✨', 'Young Adult'],
];

function SectionCard({ title, action, onAction, children, style }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode; style?: object }) {
  return (
    <View style={[pf.card, style]}>
      <View style={pf.cardHead}>
        <Text style={pf.cardTitle}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7}><Text style={pf.cardAction}>{action}</Text></TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUserStore();

  // Sign-out → root layout clears the local stores; back to the welcome screen.
  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };
  const confirmSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime — your library stays backed up in the cloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ],
    );
  };
  const avatar = profile.avatar ?? DEFAULT_AVATAR;
  const soul = ANIMALS.find((a) => a.name === profile.soulAnimal) ?? ANIMALS.find((a) => a.name === 'Fox')!;
  const traits = TRAITS[soul.name] ?? TRAITS.Fox;

  // Real reading stats from the library.
  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const { ownedCount, readCount, pagesValue, pagesUnit } = useMemo(() => {
    const owned = Object.values(shelf).filter((e) => e.status !== 'wishlist');
    const read = owned.filter((e) => e.status === 'read');
    const pages = read.reduce((sum, e) => sum + (books[e.bookId]?.pageCount ?? 0), 0);
    return {
      ownedCount: owned.length,
      readCount: read.length,
      pagesValue: pages >= 1000 ? (pages / 1000).toFixed(1) : String(pages),
      pagesUnit: pages >= 1000 ? 'k' : '',
    };
  }, [books, shelf]);

  return (
    <LinearGradient colors={['#FAF8F3', '#F3ECDF']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={pf.fill}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <View style={[pf.hero, { paddingTop: insets.top + 12 }]}>
          <LinearGradient colors={['#FBEFD7', 'rgba(250,248,243,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }} style={StyleSheet.absoluteFill} />

          <View style={[pf.heroActions, { top: insets.top + 8 }]}>
            <TouchableOpacity style={pf.iconBtn} activeOpacity={0.7} onPress={confirmSignOut} accessibilityRole="button" accessibilityLabel="Account and sign out">
              <GearIcon color={INK} />
            </TouchableOpacity>
          </View>

          <View style={pf.avatarWrap}>
            <View style={pf.avatarRing}>
              <AvatarFace skin={avatar.skin} hairStyle={avatar.hairStyle} hairColor={avatar.hairColor} size={124} />
            </View>
            <LinearGradient colors={['#FBEACB', '#F2D9A8']} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={pf.soulBadge}>
              <Text style={pf.soulBadgeEmoji}>{soul.emoji}</Text>
            </LinearGradient>
          </View>

          <Text style={pf.name}>Ross</Text>
          <Text style={pf.handle}>@rossreads · Reading since 2024</Text>

          {/* Soul feature block */}
          <View style={pf.heroSoul}>
            <LinearGradient colors={['#FBEACB', '#EFC471']} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={pf.heroSoulTile}>
              <Text style={pf.heroSoulTileEmoji}>{soul.emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={pf.heroSoulName}>{soul.name}</Text>
              <Text style={pf.soulKicker}>{titleCase(soul.archetype)}</Text>
              <View style={pf.soulLvl}><SparkIcon color="#C0851E" size={12} /><Text style={pf.soulLvlText}>Soul Level 4</Text></View>
            </View>
          </View>

          {/* Counts */}
          <View style={pf.counts}>
            {[['128', 'Following'], ['94', 'Followers'], [String(ownedCount), 'Books']].map(([v, l], i) => (
              <View key={l} style={[pf.count, i > 0 && pf.countDivider]}>
                <Text style={pf.countV}>{v}</Text>
                <Text style={pf.countL}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Reading Life ─────────────────────────────── */}
        <SectionCard title="Reading Life">
          <View style={pf.stats}>
            {[[String(readCount), '', 'Books Read'], [String(ownedCount), '', 'In Library'], [pagesValue, pagesUnit, 'Pages read']].map(([v, unit, l], i) => (
              <View key={l} style={[pf.stat, i > 0 && pf.statDivider]}>
                <Text style={pf.statV}>{v}<Text style={pf.statUnit}>{unit}</Text></Text>
                <Text style={pf.statL}>{l}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* ── Soul Animal (centerpiece) ────────────────── */}
        <SectionCard title="Your Soul Animal" action="Change" style={pf.soulCard}>
          <View style={pf.soulGlow} />
          <View style={pf.soulTop}>
            <LinearGradient colors={['#FBEACB', '#EFC471']} start={{ x: 0.5, y: 0.15 }} end={{ x: 0.5, y: 1 }} style={pf.soulTile}>
              <Text style={pf.soulTileEmoji}>{soul.emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={pf.soulName}>{soul.name}</Text>
              <Text style={pf.soulKicker}>{titleCase(soul.archetype)}</Text>
              <View style={pf.soulLvl}><SparkIcon color="#C0851E" size={12} /><Text style={pf.soulLvlText}>Soul Level 4</Text></View>
            </View>
          </View>

          <Text style={pf.soulDesc}>{soul.description}</Text>

          <View style={pf.traits}>
            {traits.map((t) => <Text key={t} style={pf.trait}>{t}</Text>)}
          </View>

          {/* Soul bond meter */}
          <View style={pf.bond}>
            <View style={pf.bondRow}>
              <Text style={pf.bondLabel}>Soul Bond</Text>
              <Text style={pf.bondMeta}>8,420 pages · 580 to Level 5</Text>
            </View>
            <View style={pf.bondTrack}>
              <LinearGradient colors={['#F0BC5A', '#E29A2A']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[pf.bondFill, { width: '74%' }]} />
            </View>
          </View>

          {/* Auras */}
          <Text style={pf.aurasLabel}>Evolve your {soul.name}</Text>
          <View style={pf.auras}>
            {AURAS.map((a) => (
              <View key={a.name} style={pf.aura}>
                <LinearGradient colors={a.colors} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={[pf.auraOrb, !a.locked && pf.auraOrbActive]}>
                  <Text style={pf.auraEmoji}>{soul.emoji}</Text>
                  {a.locked && <View style={pf.auraOverlay} />}
                  {a.locked && <View style={pf.auraLock}><LockIcon color={MUTE} size={10} /></View>}
                </LinearGradient>
                <Text style={[pf.auraName, !a.locked && pf.auraNameActive]}>{a.name}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/paywall')}>
            <LinearGradient colors={['#EFB551', '#E29A2A']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={pf.unlock}>
              <SparkIcon color={WHITE} size={13} />
              <Text style={pf.unlockText}>Unlock all auras with Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Avatar ───────────────────────────────────── */}
        <SectionCard title="Your Avatar" action="Edit ✎">
          <View style={pf.avRow}>
            <View style={pf.avRing}>
              <AvatarFace skin={avatar.skin} hairStyle={avatar.hairStyle} hairColor={avatar.hairColor} size={84} />
            </View>
            <View style={pf.avSpecs}>
              <View style={pf.spec}>
                <Text style={pf.specK}>Skin</Text>
                <View style={pf.specV}><View style={[pf.specDot, { backgroundColor: avatar.skin }]} /><Text style={pf.specVText}>Warm</Text></View>
              </View>
              <View style={pf.spec}>
                <Text style={pf.specK}>Hair</Text>
                <View style={pf.specV}><View style={[pf.specDot, { backgroundColor: avatar.hairColor }]} /><Text style={pf.specVText}>{HAIR_STYLE_NAMES[avatar.hairStyle] ?? 'Curly'}</Text></View>
              </View>
              <View style={pf.spec}>
                <Text style={pf.specK}>Outfit</Text>
                <View style={pf.specV}><Text style={pf.specVText}>🧶 Cosy Knit</Text></View>
              </View>
            </View>
          </View>
        </SectionCard>

        {/* ── Reading Tastes ───────────────────────────── */}
        <SectionCard title="Reading Tastes">
          <View style={pf.genres}>
            {GENRES.map(([em, name]) => (
              <View key={name} style={pf.genre}><Text style={pf.genreEmoji}>{em}</Text><Text style={pf.genreText}>{name}</Text></View>
            ))}
          </View>
        </SectionCard>

        {/* ── Sign out ─────────────────────────────────── */}
        <TouchableOpacity style={pf.signOut} onPress={signOut} activeOpacity={0.7}>
          <Text style={pf.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// "THE CLEVER WANDERER" → "The Clever Wanderer"
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const pf = StyleSheet.create({
  fill: { flex: 1 },

  // ── Hero
  hero: { position: 'relative', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 22 },
  heroActions: { position: 'absolute', right: 18, flexDirection: 'row', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.14)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 1 },

  avatarWrap: { width: 132, height: 132, marginTop: 4 },
  avatarRing: {
    width: 132, height: 132, borderRadius: 66, overflow: 'hidden', borderWidth: 4, borderColor: WHITE,
    backgroundColor: '#F3DDB0', alignItems: 'center', justifyContent: 'flex-end',
    shadowColor: '#D98C24', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.24, shadowRadius: 30, elevation: 8,
  },
  soulBadge: {
    position: 'absolute', right: -2, bottom: 4, width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE,
    shadowColor: '#D98C24', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
  },
  soulBadgeEmoji: { fontSize: 25 },

  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: INK, marginTop: 16 },
  handle: { fontSize: 13, fontWeight: '600', color: MUTE, marginTop: 4 },

  heroSoul: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16,
    paddingVertical: 12, paddingLeft: 12, paddingRight: 20, borderRadius: 22,
    backgroundColor: WHITE, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.14)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 2,
  },
  heroSoulTile: { width: 66, height: 66, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: '#D98C24', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 5 },
  heroSoulTileEmoji: { fontSize: 38 },
  heroSoulName: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 23, color: INK, lineHeight: 25 },

  counts: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  count: { paddingHorizontal: 22, alignItems: 'center' },
  countDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(139,94,60,0.14)' },
  countV: { fontSize: 18, fontWeight: '800', color: INK, letterSpacing: -0.3 },
  countL: { fontSize: 11, fontWeight: '700', color: MUTE, marginTop: 2 },

  // ── Generic card
  card: { marginHorizontal: 18, marginTop: 14, backgroundColor: WHITE, borderRadius: 22, padding: 18, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase', color: '#C99A4C' },
  cardAction: { fontSize: 13, fontWeight: '800', color: BROWN },

  // ── Reading Life stats
  stats: { flexDirection: 'row', marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(139,94,60,0.12)' },
  statV: { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.4 },
  statUnit: { fontSize: 14 },
  statL: { fontSize: 11, fontWeight: '700', color: MUTE, marginTop: 3 },

  // ── Soul card
  soulCard: { overflow: 'hidden' },
  soulGlow: { position: 'absolute', top: -60, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(232,168,56,0.10)' },
  soulTop: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 14 },
  soulTile: { width: 96, height: 96, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#D98C24', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 26, elevation: 6 },
  soulTileEmoji: { fontSize: 54 },
  soulName: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 28, color: INK, lineHeight: 30 },
  soulKicker: { fontSize: 13, fontWeight: '800', color: '#C99A4C', marginTop: 7 },
  soulLvl: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: 10, paddingVertical: 4, paddingHorizontal: 11, borderRadius: 999, backgroundColor: '#FBF1DC' },
  soulLvlText: { fontSize: 12, fontWeight: '800', color: '#C0851E' },
  soulDesc: { fontSize: 14, fontWeight: '500', lineHeight: 21, color: '#6b6052', marginTop: 16 },

  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  trait: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#F6EFE2', color: BROWN, fontSize: 12.5, fontWeight: '800', overflow: 'hidden' },

  bond: { marginTop: 20 },
  bondRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  bondLabel: { fontSize: 13.5, fontWeight: '800', color: INK },
  bondMeta: { fontSize: 12, fontWeight: '700', color: MUTE },
  bondTrack: { height: 9, borderRadius: 99, backgroundColor: '#EFE7DA', marginTop: 9, overflow: 'hidden' },
  bondFill: { height: '100%', borderRadius: 99 },

  aurasLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: MUTE, marginTop: 20, marginBottom: 12 },
  auras: { flexDirection: 'row', gap: 10 },
  aura: { flex: 1, alignItems: 'center', gap: 7 },
  auraOrb: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#5A3C23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 3 },
  auraOrbActive: { borderWidth: 2, borderColor: WHITE },
  auraEmoji: { fontSize: 25 },
  auraOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 25, backgroundColor: 'rgba(40,30,20,0.34)' },
  auraLock: { position: 'absolute', right: -3, bottom: -3, width: 19, height: 19, borderRadius: 999, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 2 },
  auraName: { fontSize: 11, fontWeight: '800', color: MUTE },
  auraNameActive: { color: '#C0851E' },

  unlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, paddingVertical: 12, borderRadius: 14, shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.34, shadowRadius: 18, elevation: 4 },
  unlockText: { color: WHITE, fontSize: 14, fontWeight: '800' },

  // ── Avatar card
  avRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16 },
  avRing: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', borderWidth: 3, borderColor: WHITE, backgroundColor: '#F3DDB0', alignItems: 'center', justifyContent: 'flex-end', shadowColor: '#D98C24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 4 },
  avSpecs: { flex: 1, gap: 12 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  specK: { width: 50, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, color: MUTE },
  specV: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  specVText: { fontSize: 13.5, fontWeight: '700', color: INK },
  specDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },

  // ── Reading Tastes
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  genre: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#F6EFE2', borderWidth: 1, borderColor: 'rgba(139,94,60,0.12)' },
  genreEmoji: { fontSize: 13 },
  genreText: { color: '#6b6052', fontSize: 13, fontWeight: '700' },

  // ── Sign out
  signOut: { alignSelf: 'center', marginTop: 22, paddingVertical: 12, paddingHorizontal: 24 },
  signOutText: { fontSize: 14, fontWeight: '800', color: '#E0506B' },
});
