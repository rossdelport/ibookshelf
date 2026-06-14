import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ANIMALS } from '../../constants/animals';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 4; // segments 0–4 filled (screen 06)

function Chevron() {
  return (
    <View style={soul.chevronWrap}>
      <View style={soul.chevronArm1} />
      <View style={soul.chevronArm2} />
    </View>
  );
}

function AnimalCard({ name, emoji, onPress }: { name: string; emoji: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={soul.card} onPress={onPress} activeOpacity={0.85}>
      <View style={soul.tile}>
        <Text style={soul.tileEmoji}>{emoji}</Text>
      </View>
      <Text style={soul.cardLabel}>{name}</Text>
    </TouchableOpacity>
  );
}

export default function SoulScreen() {
  const rows: (typeof ANIMALS)[] = [];
  for (let i = 0; i < ANIMALS.length; i += 2) rows.push(ANIMALS.slice(i, i + 2));

  const open = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/onboarding/soul-detail', params: { animal: name } });
  };

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

      <ScrollView style={soul.scroll} contentContainerStyle={soul.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={soul.title}>Every reader has a soul.</Text>
        <Text style={soul.sub}>Which one is yours?</Text>

        <View style={soul.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={soul.gridRow}>
              {row.map((animal) => (
                <AnimalCard key={animal.name} name={animal.name} emoji={animal.emoji} onPress={() => open(animal.name)} />
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
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 24 },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  segActive: { backgroundColor: colors.accent },

  // ── Title
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1, marginTop: 24 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginTop: 8, marginBottom: 24 },

  // ── Grid
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  cardPlaceholder: { flex: 1 },

  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 12, ...shadow.cardSoft },
  tile: { backgroundColor: colors.chip, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, marginBottom: 10 },
  tileEmoji: { fontSize: 52 },
  cardLabel: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1, textAlign: 'center', paddingBottom: 2 },
});
