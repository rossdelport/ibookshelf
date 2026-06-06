import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK    = '#332C24';
const MUTE   = '#A89A88';
const AMBER  = '#E8A838';
const PAPER  = '#FAF8F3';
const WHITE  = '#FFFFFF';

const TOTAL_STEPS  = 11;
const CURRENT_STEP = 2; // segments 0–2 filled (screen 04)

const GENRES = [
  { label: 'Fantasy',             emoji: '📖' },
  { label: 'Romance',             emoji: '💕' },
  { label: 'Business',            emoji: '💼' },
  { label: 'Thriller',            emoji: '✒️' },
  { label: 'Sci-Fi',              emoji: '🚀' },
  { label: 'Cosy & Cottagecore',  emoji: '🌿' },
  { label: 'Classic Literature',  emoji: '🏛️' },
  { label: 'Horror',              emoji: '😱' },
  { label: 'Mystery',             emoji: '🔍' },
  { label: 'Young Adult',         emoji: '✨' },
];

function Chevron() {
  return (
    <View style={gen.chevronWrap}>
      <View style={gen.chevronArm1} />
      <View style={gen.chevronArm2} />
    </View>
  );
}

export default function GenresScreen() {
  const { profile, toggleGenre } = useUserStore();
  const selected = profile.favouriteGenres;

  return (
    <SafeAreaView style={gen.safe}>
      {/* ── Topbar ─────────────────────────────────────── */}
      <View style={gen.topbar}>
        <TouchableOpacity
          style={gen.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Chevron />
        </TouchableOpacity>

        <View style={gen.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[gen.progressSeg, i <= CURRENT_STEP && gen.progressSegActive]}
            />
          ))}
        </View>
      </View>

      {/* ── Question ───────────────────────────────────── */}
      <View style={gen.questionBlock}>
        <Text style={gen.question}>What do you love{'\n'}to read?</Text>
        <Text style={gen.sub}>
          Pick as many as you like, and we'll personalise your experience around them.
        </Text>
      </View>

      {/* ── Genre chips ────────────────────────────────── */}
      <View style={gen.chipWrap}>
        {GENRES.map(({ label, emoji }) => {
          const active = selected.includes(label);
          return (
            <TouchableOpacity
              key={label}
              style={[gen.chip, active && gen.chipActive]}
              onPress={() => toggleGenre(label)}
              activeOpacity={0.75}
            >
              <Text style={gen.chipEmoji}>{emoji}</Text>
              <Text style={[gen.chipLabel, active && gen.chipLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Footer ─────────────────────────────────────── */}
      <View style={gen.footer}>
        <TouchableOpacity
          style={gen.cta}
          onPress={() => router.push('/onboarding/avatar')}
          activeOpacity={0.85}
        >
          <Text style={gen.ctaText}>Continue  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const gen = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAPER,
  },

  // ── Topbar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  chevronWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -2,
  },
  chevronArm1: {
    position: 'absolute',
    width: 7,
    height: 2,
    borderRadius: 1,
    backgroundColor: INK,
    top: 2.5,
    left: 2,
    transform: [{ rotate: '-45deg' }],
  },
  chevronArm2: {
    position: 'absolute',
    width: 7,
    height: 2,
    borderRadius: 1,
    backgroundColor: INK,
    bottom: 2.5,
    left: 2,
    transform: [{ rotate: '45deg' }],
  },

  // ── Progress
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  progressSeg: {
    flex: 1,
    height: 3.5,
    borderRadius: 999,
    backgroundColor: 'rgba(139,94,60,0.15)',
  },
  progressSegActive: {
    backgroundColor: AMBER,
  },

  // ── Question block
  questionBlock: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 10,
  },
  question: {
    fontSize: 28,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  sub: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTE,
    lineHeight: 21,
  },

  // ── Chip grid — flex wrap, gap per §4 (chip rows: 8–10px)
  chipWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    alignContent: 'flex-start',
  },

  // Unselected chip — white bg, hairline border (§5 Chip/pill)
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WHITE,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(139,94,60,0.12)',
    paddingVertical: 11,
    paddingHorizontal: 16,
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  // Selected chip — amber fill, amber glow (§5 On state)
  chipActive: {
    backgroundColor: AMBER,
    borderColor: AMBER,
    shadowColor: '#E29A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  chipEmoji: {
    fontSize: 17,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  chipLabelActive: {
    color: WHITE,
  },

  // ── Footer CTA — ob-cta variant (§5)
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
  },
  cta: {
    backgroundColor: AMBER,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    shadowColor: '#E29A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  ctaText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
