import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const TOTAL_STEPS  = 10;
const CURRENT_STEP = 9; // segments 0–9 filled (screen 10)

// ── Reader data (from design ObCircle) ─────────────────────────────────────
// require() needs static paths, so avatars are mapped explicitly.
const AVATARS: Record<string, ImageSourcePropType> = {
  maya:  require('../../assets/images/av_maya.png'),
  priya: require('../../assets/images/av_priya.png'),
  theo:  require('../../assets/images/av_theo.png'),
  sam:   require('../../assets/images/av_sam.png'),
  noor:  require('../../assets/images/av_noor.png'),
  leo:   require('../../assets/images/av_leo.png'),
};

interface Reader {
  key: string;
  soul: string;       // soul-animal emoji badge
  name: string;
  loc: string;
  soulName: string;   // soul archetype label
  reading: string;    // current book
  bookSoul: string;   // emoji tag on current book
  following: boolean;
}

const READERS: Reader[] = [
  { key: 'maya',  soul: '🦉', name: 'Maya',  loc: 'London, UK',  soulName: 'Owl',    reading: 'Iron Flame',                  bookSoul: '🐉', following: true  },
  { key: 'priya', soul: '🐉', name: 'Priya', loc: 'Mumbai, IN',  soulName: 'Dragon', reading: 'A Court of Thorns & Roses',   bookSoul: '🦊', following: true  },
  { key: 'theo',  soul: '🦌', name: 'Theo',  loc: 'Berlin, DE',  soulName: 'Deer',   reading: 'Babel',                       bookSoul: '🦉', following: false },
  { key: 'sam',   soul: '🐺', name: 'Sam',   loc: 'Austin, US',  soulName: 'Wolf',   reading: 'Fourth Wing',                 bookSoul: '🦊', following: false },
  { key: 'noor',  soul: '🦊', name: 'Noor',  loc: 'Sydney, AU',  soulName: 'Fox',    reading: 'Babel',                       bookSoul: '🦌', following: false },
  { key: 'leo',   soul: '🦅', name: 'Leo',   loc: 'Toronto, CA', soulName: 'Eagle',  reading: 'Iron Flame',                  bookSoul: '🐺', following: false },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={rc.chevronWrap}>
      <View style={rc.chevronArm1} />
      <View style={rc.chevronArm2} />
    </View>
  );
}

function ReaderRow({ reader }: { reader: Reader }) {
  const [following, setFollowing] = useState(reader.following);

  return (
    <View style={rc.row}>
      {/* Avatar + soul badge (§5 avatar+soul unit) */}
      <View style={rc.avWrap}>
        <Image source={AVATARS[reader.key]} style={rc.av} resizeMode="cover" />
        <View style={rc.soulBadge}>
          <Text style={rc.soulEmoji}>{reader.soul}</Text>
        </View>
      </View>

      {/* Text block */}
      <View style={rc.txt}>
        <Text style={rc.name} numberOfLines={1}>
          {reader.name} <Text style={rc.nameLoc}>· {reader.loc}</Text>
        </Text>
        <Text style={rc.soulName}>{reader.soul} {reader.soulName}</Text>
        <Text style={rc.act} numberOfLines={1}>Reading {reader.reading} · {reader.bookSoul}</Text>
      </View>

      {/* Follow toggle */}
      <TouchableOpacity
        style={[rc.follow, following && rc.followOn]}
        onPress={() => setFollowing((f) => !f)}
        activeOpacity={0.85}
      >
        <Text style={[rc.followText, following && rc.followTextOn]}>
          {following ? 'Following ✓' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function CircleScreen() {
  return (
    <SafeAreaView style={rc.safe}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={rc.topbar}>
        <TouchableOpacity style={rc.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={rc.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[rc.seg, i <= CURRENT_STEP && rc.segActive]} />
          ))}
        </View>
      </View>

      {/* ── Head ─────────────────────────────────────── */}
      <View style={rc.head}>
        <Text style={rc.title}>Find your{'\n'}reading tribe.</Text>
        <Text style={rc.sub}>Follow a few readers and your community comes alive.</Text>
      </View>

      {/* ── Reader list ──────────────────────────────── */}
      <ScrollView
        style={rc.body}
        contentContainerStyle={rc.list}
        showsVerticalScrollIndicator={false}
      >
        {READERS.map((reader) => (
          <ReaderRow key={reader.key} reader={reader} />
        ))}
      </ScrollView>

      {/* ── Footer ───────────────────────────────────── */}
      <View style={rc.footer}>
        <TouchableOpacity style={rc.cta} onPress={() => router.push('/onboarding/paywall')} activeOpacity={0.85}>
          <Text style={rc.ctaText}>Continue  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const rc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg:         { flex: 1, height: 3.5, borderRadius: 999, backgroundColor: 'rgba(139,94,60,0.15)' },
  segActive:   { backgroundColor: AMBER },

  // ── Head (§3 ob-title / ob-sub)
  head: { paddingHorizontal: 22, marginTop: 26 },
  title: { fontSize: 27, fontWeight: '800', color: INK, letterSpacing: -0.5, lineHeight: 30 },
  sub:   { fontSize: 14.5, fontWeight: '500', color: '#8a7d6d', lineHeight: 21, marginTop: 9 },

  // ── List
  body: { flex: 1, marginTop: 18 },
  list: { paddingHorizontal: 22, paddingBottom: 8, gap: 10 },

  // Reader row — white card §4
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 13, borderRadius: 16, backgroundColor: WHITE,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.10)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },

  // Avatar + soul badge
  avWrap: { width: 50, height: 50 },
  av: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, borderColor: WHITE, // white ring §
  },
  soulBadge: {
    position: 'absolute', right: -4, bottom: -4,
    width: 23, height: 23, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.28, shadowRadius: 4, elevation: 2,
  },
  soulEmoji: { fontSize: 12 },

  // Text block
  txt: { flex: 1, minWidth: 0 },
  name:    { fontSize: 15, fontWeight: '800', color: INK },
  nameLoc: { fontSize: 12, fontWeight: '600', color: MUTE },
  soulName: { fontSize: 11.5, fontWeight: '800', color: '#E29A2A', marginTop: 1 },
  act:     { fontSize: 12, fontWeight: '600', color: '#8a7d6d', marginTop: 2 },

  // Follow button — amber-pale soft badge / amber filled "on"
  follow: {
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: '#FBEACB',
  },
  followOn: {
    backgroundColor: AMBER,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
  },
  followText:   { fontSize: 13, fontWeight: '800', color: '#C0851E' },
  followTextOn: { color: WHITE },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
