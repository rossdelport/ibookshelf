import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { ArrowIcon, BellIcon, PlayIcon, SearchIcon } from '../../components/icons';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

// ── Progress arc behind the hero book (240° sweep from 150°) ───────────────
function ProgressArc({ pct }: { pct: number }) {
  const r = 126, c = 150;
  const start = 150, total = 240;
  const polar = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)] as const;
  };
  const [x0, y0] = polar(start);
  const [x1, y1] = polar(start + total);
  const [xp, yp] = polar(start + total * pct);
  const largeTrack = total > 180 ? 1 : 0;
  const largeProg  = total * pct > 180 ? 1 : 0;

  return (
    <Svg width={300} height={300} viewBox="0 0 300 300" style={ho.arc}>
      <Defs>
        <SvgGradient id="ag" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#F0BC5A" />
          <Stop offset="1" stopColor="#E29A2A" />
        </SvgGradient>
      </Defs>
      <Path d={`M${x0} ${y0} A${r} ${r} 0 ${largeTrack} 1 ${x1} ${y1}`} fill="none" stroke="#EFE7DA" strokeWidth={9} strokeLinecap="round" />
      <Path d={`M${x0} ${y0} A${r} ${r} 0 ${largeProg} 1 ${xp} ${yp}`} fill="none" stroke="url(#ag)" strokeWidth={9} strokeLinecap="round" />
    </Svg>
  );
}

// ── 3D hero book ────────────────────────────────────────────────────────────
function HeroBook() {
  return (
    <View style={ho.bookZone}>
      <View style={ho.bookShadow} />
      <View style={ho.book3d}>
        <Image source={require('../../assets/images/cover.png')} style={ho.bookCover} resizeMode="cover" />
        {/* Spine shade (inset-left) */}
        <LinearGradient colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 0.28, y: 0.5 }} style={ho.bookSpine} />
        {/* Page edges on the right */}
        <View style={ho.bookPages} />
        {/* Sheen */}
        <LinearGradient colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0.45 }} style={ho.bookSheen} />
      </View>
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

function Friend({ avatar, soul, name, book, pct }: { avatar: any; soul: string; name: string; book: string; pct: string }) {
  return (
    <View style={ho.friend}>
      <View style={ho.friendAv}>
        <Image source={avatar} style={ho.favatar} resizeMode="cover" />
        <View style={ho.fsoul}><Text style={ho.fsoulEmoji}>{soul}</Text></View>
      </View>
      <View style={ho.friendTxt}>
        <Text style={ho.friendName}>{name}</Text>
        <Text style={ho.friendBook}>reading <Text style={ho.friendBookEm}>{book}</Text></Text>
      </View>
      <Text style={ho.friendPct}>{pct}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const pagesRead = 312, pagesTotal = 517;
  const pct = pagesRead / pagesTotal;

  return (
    <ScrollView
      style={ho.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={ho.topbar}>
        <View style={ho.avatarWrap}>
          <Image source={require('../../assets/images/av_me.png')} style={ho.avatar} resizeMode="cover" />
          <View style={ho.soul}><Text style={ho.soulEmoji}>🦊</Text></View>
        </View>
        <View style={ho.topActions}>
          <TouchableOpacity style={ho.iconBtn} activeOpacity={0.7}>
            <BellIcon color={INK} />
            <View style={ho.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity style={ho.iconBtn} activeOpacity={0.7}>
            <SearchIcon color={INK} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Greeting ─────────────────────────────────── */}
      <View style={ho.greeting}>
        <Text style={ho.greetingH1}>Good morning, Ross <Text style={ho.leaf}>🌿</Text></Text>
        <Text style={ho.streak}>🔥 14 day reading streak</Text>
      </View>

      {/* ── Hero ─────────────────────────────────────── */}
      <View style={ho.hero}>
        <ProgressArc pct={pct} />
        <HeroBook />
        <View style={ho.pagesBadge}>
          <Text style={ho.pagesBadgeText}><Text style={ho.pagesBadgeStrong}>{pagesRead}</Text>/{pagesTotal} pages</Text>
        </View>
      </View>

      <View style={ho.bookMeta}>
        <Text style={ho.bookTitle}>Fourth Wing</Text>
        <Text style={ho.bookAuthor}>Rebecca Yarros</Text>
      </View>

      <TouchableOpacity style={ho.startBtn} activeOpacity={0.85}>
        <PlayIcon color={WHITE} />
        <Text style={ho.startBtnText}>Start Reading Session</Text>
      </TouchableOpacity>

      {/* ── Quick stats ──────────────────────────────── */}
      <View style={ho.stats}>
        <Stat emoji="📚" value="12"  label="Books Read" />
        <Stat emoji="📄" value="847" label="Pages · Month" />
        <Stat emoji="🔥" value="14"  label="Day Streak" />
      </View>

      {/* ── My Shelf card ────────────────────────────── */}
      <View style={ho.bigCard}>
        <View style={ho.bigCardHead}>
          <View>
            <Text style={ho.bigCardTitle}>My Shelf</Text>
            <Text style={ho.bigCardSub}>Currently reading · 4 books</Text>
          </View>
          <ArrowIcon color={MUTE} />
        </View>
        <View style={ho.shelfRow}>
          <LinearGradient colors={['#3A2E50', '#5B3550']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ho.miniBook} />
          <LinearGradient colors={['#1F5C4D', '#2E7D63']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ho.miniBook} />
          <LinearGradient colors={['#8B3A2E', '#B5572F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ho.miniBook} />
          <LinearGradient colors={['#23415E', '#356087']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ho.miniBook} />
          <View style={ho.shelfMore}><Text style={ho.shelfMoreText}>+8</Text></View>
        </View>
      </View>

      {/* ── Community card ───────────────────────────── */}
      <View style={ho.bigCard}>
        <View style={ho.bigCardHead}>
          <View>
            <Text style={ho.bigCardTitle}>Community</Text>
            <Text style={ho.bigCardSub}>2 friends reading now</Text>
          </View>
          <ArrowIcon color={MUTE} />
        </View>
        <View style={ho.friendList}>
          <Friend avatar={require('../../assets/images/av_maya.png')} soul="🦉" name="Maya" book="Iron Flame" pct="62%" />
          <Friend avatar={require('../../assets/images/av_theo.png')} soul="🦌" name="Theo" book="Babel" pct="28%" />
        </View>
      </View>
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
  hero: { height: 296, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  arc: { position: 'absolute', top: '50%', left: '50%', marginTop: -150, marginLeft: -150 },

  bookZone: { alignItems: 'center', justifyContent: 'center', marginTop: -18 },
  bookShadow: {
    position: 'absolute', bottom: -22, width: 130, height: 22, borderRadius: 60,
    backgroundColor: 'rgba(90,60,35,0.28)', opacity: 0.9, transform: [{ scaleX: 1.2 }],
  },
  book3d: {
    width: 152, height: 226,
    transform: [{ perspective: 1400 }, { rotateY: '-21deg' }, { rotateX: '5deg' }, { rotateZ: '-1deg' }],
  },
  bookCover: { position: 'absolute', top: 0, left: 0, width: 152, height: 226, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  bookSpine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 152, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  bookPages: {
    position: 'absolute', top: 3, bottom: 3, right: -11, width: 13, backgroundColor: '#EFE6D2',
    borderRadius: 2, transform: [{ perspective: 600 }, { rotateY: '40deg' }],
  },
  bookSheen: { position: 'absolute', top: 0, left: 0, width: 152, height: 226, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderTopRightRadius: 7, borderBottomRightRadius: 7 },

  pagesBadge: {
    position: 'absolute', bottom: 8, backgroundColor: WHITE, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
  },
  pagesBadgeText: { fontSize: 12.5, fontWeight: '600', color: BROWN },
  pagesBadgeStrong: { color: INK, fontWeight: '800' },

  // ── Book meta
  bookMeta: { alignItems: 'center', marginTop: 2 },
  bookTitle: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 21, color: INK, letterSpacing: 0.1 },
  bookAuthor: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, color: MUTE, marginTop: 1 },

  // ── Start button
  startBtn: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6,
    paddingVertical: 14, paddingHorizontal: 26, borderRadius: 999, backgroundColor: AMBER,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  startBtnText: { color: WHITE, fontWeight: '800', fontSize: 15.5, letterSpacing: 0.1 },

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
    shadowColor: '#5A3C23', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.18, shadowRadius: 7, elevation: 2,
  },
  shelfMore: {
    width: 44, height: 64, borderRadius: 5, backgroundColor: '#F6EFE2',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderStyle: 'dashed',
  },
  shelfMoreText: { color: BROWN, fontWeight: '800', fontSize: 14 },

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
