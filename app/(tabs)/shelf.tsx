import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookCover } from '../../components/BookCover';
import { PlusIcon, SearchIcon } from '../../components/icons';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const WHITE = '#FFFFFF';

interface Book { t: string; a: string; bg: string; ink: string; pct?: number }

const BOOKS: Book[] = [
  { t: 'Fourth Wing',      a: 'Rebecca Yarros',   bg: '#463353', ink: '#D8B26A', pct: 0.6 },
  { t: 'Iron Flame',       a: 'Rebecca Yarros',   bg: '#5A2A38', ink: '#D8B26A' },
  { t: 'Court of Roses',   a: 'Sarah J. Maas',    bg: '#4A3A5E', ink: '#C9B6E0' },
  { t: 'Babel',            a: 'R. F. Kuang',      bg: '#2E4A3E', ink: '#D8B26A' },
  { t: 'Circe',            a: 'Madeline Miller',  bg: '#8A4A2E', ink: '#EBE0C9' },
  { t: 'Song of Achilles', a: 'Madeline Miller',  bg: '#1F4A4A', ink: '#D8B26A' },
  { t: 'Piranesi',         a: 'Susanna Clarke',   bg: '#3A4A60', ink: '#EBE0C9' },
  { t: 'Crescent City',    a: 'Sarah J. Maas',    bg: '#5A2233', ink: '#D8B26A' },
  { t: 'Mexican Gothic',   a: 'S. Moreno-Garcia', bg: '#26382E', ink: '#E0B0BC' },
  { t: 'The Atlas Six',    a: 'Olivie Blake',     bg: '#262430', ink: '#D8B26A' },
  { t: 'The Priory',       a: 'Samantha Shannon', bg: '#1E4A3A', ink: '#D8B26A' },
  { t: 'Yellowface',       a: 'R. F. Kuang',      bg: '#C9A22E', ink: '#2A2620' },
  { t: 'Name of the Wind', a: 'Patrick Rothfuss', bg: '#3A352F', ink: '#D8B26A' },
  { t: 'Hail Mary',        a: 'Andy Weir',        bg: '#23304F', ink: '#EBE0C9' },
  { t: 'A Little Life',    a: 'Hanya Yanagihara', bg: '#6A3A20', ink: '#EBE0C9' },
];

const FILTERS = ['All', 'Reading', 'Finished', 'Want to read'];

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ── Wooden shelf plank (§5) ────────────────────────────────────────────────
function Plank() {
  return (
    <View style={sl.plankWrap}>
      <LinearGradient
        colors={['#CDA268', '#B5854C', '#9C6E3A']}
        locations={[0, 0.52, 1]}
        style={sl.plank}
      >
        <View style={sl.plankHighlight} />
      </LinearGradient>
      {/* Drop edge */}
      <LinearGradient colors={['#7E5226', '#65401A']} style={sl.plankEdge} />
    </View>
  );
}

export default function ShelfScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');

  return (
    <LinearGradient colors={['#FAF8F3', '#F3ECDF']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={sl.fill}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={[sl.topbar, { paddingTop: insets.top + 4 }]}>
        <View style={sl.avatarWrap}>
          <Image source={require('../../assets/images/av_me.png')} style={sl.avatar} resizeMode="cover" />
          <View style={sl.soul}><Text style={sl.soulEmoji}>🦊</Text></View>
        </View>
        <View style={sl.topActions}>
          <TouchableOpacity style={sl.iconBtn} activeOpacity={0.7}><SearchIcon color={INK} /></TouchableOpacity>
          <TouchableOpacity style={sl.iconBtn} activeOpacity={0.7}><PlusIcon color={INK} /></TouchableOpacity>
        </View>
      </View>

      {/* ── Heading ──────────────────────────────────── */}
      <View style={sl.head}>
        <Text style={sl.h1}>My Library</Text>
        <Text style={sl.sub}><Text style={sl.subStrong}>15 books</Text> · 12 read this year</Text>
      </View>

      {/* ── Filter chips ─────────────────────────────── */}
      <View style={sl.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sl.filters}>
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <TouchableOpacity key={f} style={[sl.chip, active && sl.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
                <Text style={[sl.chipText, active && sl.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Wooden shelves, 3 across ─────────────────── */}
      <ScrollView
        style={sl.shelves}
        contentContainerStyle={[sl.shelvesContent, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {chunk(BOOKS, 3).map((row, i) => (
          <View key={i} style={sl.row}>
            <View style={sl.books}>
              {row.map((b) => (
                <View key={b.t} style={sl.bookSlot}>
                  <BookCover title={b.t} author={b.a} bg={b.bg} ink={b.ink} pct={b.pct} />
                </View>
              ))}
              {/* keep last row left-aligned if fewer than 3 */}
              {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, k) => <View key={`s${k}`} style={sl.bookSlot} />)}
            </View>
            <Plank />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const sl = StyleSheet.create({
  fill: { flex: 1 },

  // ── Topbar (shared pattern)
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 4 },
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

  // ── Heading
  head: { paddingHorizontal: 22, paddingTop: 14 },
  h1: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5, color: INK },
  sub: { marginTop: 4, fontSize: 13.5, fontWeight: '600', color: MUTE },
  subStrong: { color: BROWN, fontWeight: '700' },

  // ── Filters
  filtersWrap: { paddingTop: 14, paddingBottom: 8 },
  filters: { paddingHorizontal: 22, gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, backgroundColor: WHITE,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.16)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { fontSize: 13, fontWeight: '700', color: BROWN },
  chipTextActive: { color: WHITE },

  // ── Shelves
  shelves: { flex: 1 },
  shelvesContent: { paddingHorizontal: 22, paddingTop: 12, gap: 32 },
  row: {},
  books: { flexDirection: 'row', alignItems: 'flex-end', gap: 18, zIndex: 2 },
  bookSlot: { flex: 1 },

  // Wooden plank
  plankWrap: { marginTop: -2, zIndex: 1 },
  plank: {
    height: 14, borderRadius: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 3,
  },
  plankHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  plankEdge: {
    height: 7, marginHorizontal: -5, borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    shadowColor: '#462D14', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 11, elevation: 4,
  },
});
