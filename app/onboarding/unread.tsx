import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK    = '#332C24';
const MUTE   = '#A89A88';
const AMBER  = '#E8A838';
const PAPER  = '#FAF8F3';
const WHITE  = '#FFFFFF';
const BROWN  = 'rgba(139,94,60,0.12)';

const TOTAL_STEPS = 11;
const CURRENT_STEP = 0; // 0-indexed; first question in the onboarding flow

const OPTIONS = [
  { label: '0-5',   emoji: '🌱' },
  { label: '5-10',  emoji: '📚' },
  { label: '10-20', emoji: '😅' },
  { label: '20+',   emoji: '😁' },
];

function Chevron() {
  return (
    <View style={ob.chevronWrap}>
      <View style={ob.chevronArm1} />
      <View style={ob.chevronArm2} />
    </View>
  );
}

export default function UnreadScreen() {
  const [selected, setSelected] = useState<number | null>(null); // none preselected

  // Fade/slide the Continue button in once a choice is made
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (selected !== null) {
      Animated.timing(appear, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [selected, appear]);

  return (
    <SafeAreaView style={ob.safe}>
      {/* ── Topbar: back + progress ───────────────────────── */}
      <View style={ob.topbar}>
        <TouchableOpacity
          style={ob.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Chevron />
        </TouchableOpacity>

        <View style={ob.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[ob.progressSeg, i <= CURRENT_STEP && ob.progressSegActive]}
            />
          ))}
        </View>
      </View>

      {/* ── Question ─────────────────────────────────────── */}
      <View style={ob.questionBlock}>
        <Text style={ob.question}>
          How many books do you have sitting unread?
        </Text>
        <Text style={ob.sub}>No judgment here.</Text>
      </View>

      {/* ── Choice rows ──────────────────────────────────── */}
      <View style={ob.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected === i;
          return (
            <TouchableOpacity
              key={opt.label}
              style={[ob.row, active && ob.rowActive]}
              onPress={() => setSelected(i)}
              activeOpacity={0.8}
            >
              <Text style={[ob.rowLabel, active && ob.rowLabelActive]}>
                {opt.label}
              </Text>
              <Text style={ob.rowEmoji}>{opt.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Footer CTA — appears only after a choice is made ─ */}
      <View style={ob.footer}>
        {selected !== null && (
          <Animated.View
            style={{
              opacity: appear,
              transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            }}
          >
            <TouchableOpacity
              style={ob.cta}
              onPress={() => router.push('/onboarding/mirror')}
              activeOpacity={0.85}
            >
              <Text style={ob.ctaText}>Continue  →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const ob = StyleSheet.create({
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
    borderColor: BROWN,
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  // Chevron built from two rotated rect arms
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

  // ── Progress bar
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
    paddingTop: 36,
    paddingBottom: 32,
  },
  question: {
    fontSize: 26,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.4,
    lineHeight: 34,
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTE,
  },

  // ── Option rows
  options: {
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 0.5,
    borderColor: BROWN,
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  rowActive: {
    backgroundColor: AMBER,
    borderColor: AMBER,
    shadowColor: '#E29A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
  },
  rowLabelActive: {
    color: WHITE,
  },
  rowEmoji: {
    fontSize: 22,
  },

  // ── Footer CTA
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
