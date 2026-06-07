import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ANIMALS } from '../../constants/animals';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const TOTAL_STEPS  = 9;
const CURRENT_STEP = 4; // segments 0–4 filled (screen 06)

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={soul.chevronWrap}>
      <View style={soul.chevronArm1} />
      <View style={soul.chevronArm2} />
    </View>
  );
}

function AnimalCard({
  name,
  emoji,
  onPress,
}: {
  name: string;
  emoji: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={soul.card} onPress={onPress} activeOpacity={0.85}>
      <View style={soul.tile}>
        <Text style={soul.tileEmoji}>{emoji}</Text>
      </View>
      <Text style={soul.cardLabel}>{name}</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function SoulScreen() {
  // Pair animals into rows of 2
  const rows: (typeof ANIMALS)[] = [];
  for (let i = 0; i < ANIMALS.length; i += 2) {
    rows.push(ANIMALS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={soul.safe}>
      {/* ── Topbar ─────────────────────────────────────── */}
      <View style={soul.topbar}>
        <TouchableOpacity style={soul.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={soul.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[soul.seg, i <= CURRENT_STEP && soul.segActive]} />
          ))}
        </View>
      </View>

      {/* ── Scrollable content ─────────────────────────── */}
      <ScrollView
        style={soul.scroll}
        contentContainerStyle={soul.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title — Lora serif per §3 "Onboarding title (serif variant)" */}
        <Text style={soul.title}>Every reader has a soul.</Text>
        <Text style={soul.sub}>Which one is yours?</Text>

        <View style={soul.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={soul.gridRow}>
              {row.map((animal) => (
                <AnimalCard
                  key={animal.name}
                  name={animal.name}
                  emoji={animal.emoji}
                  onPress={() =>
                    router.push({
                      pathname: '/onboarding/soul-detail',
                      params: { animal: animal.name },
                    })
                  }
                />
              ))}
              {row.length === 1 && <View style={soul.cardPlaceholder} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const soul = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: PAPER },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

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

  // ── Title — Georgia (Lora fallback) §3
  title: { fontSize: 30, fontWeight: '600', fontFamily: 'Georgia', color: INK, marginTop: 24, letterSpacing: -0.3 },
  sub:   { fontSize: 14, fontWeight: '500', color: MUTE, marginTop: 6, marginBottom: 24 },

  // ── Grid
  grid:            { gap: 12 },
  gridRow:         { flexDirection: 'row', gap: 12 },
  cardPlaceholder: { flex: 1 },

  // ── Animal card (§5 card pattern — unselected)
  card: {
    flex: 1, backgroundColor: WHITE, borderRadius: 20,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    padding: 12,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  tile: {
    backgroundColor: '#F6EFE2', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, marginBottom: 10,
  },
  tileEmoji: { fontSize: 52 },
  cardLabel:  { fontSize: 15, fontWeight: '800', color: INK, textAlign: 'center', paddingBottom: 2 },
});
