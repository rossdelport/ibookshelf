import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 0;

const OPTIONS = [
  { label: 'Under 20', emoji: '🌱' },
  { label: '20–50', emoji: '📚' },
  { label: '50–150', emoji: '📖' },
  { label: '150+', emoji: '🏛️' },
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
  const { setLibrarySize } = useUserStore();
  const [selected, setSelected] = useState<number | null>(null);

  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (selected !== null) Animated.timing(appear, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [selected, appear]);

  return (
    <SafeAreaView style={ob.safe}>
      <View style={ob.topbar}>
        <TouchableOpacity style={ob.backBtn} onPress={() => router.back()} activeOpacity={0.7}><Chevron /></TouchableOpacity>
        <View style={ob.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[ob.progressSeg, i <= CURRENT_STEP && ob.progressSegActive]} />
          ))}
        </View>
      </View>

      <View style={ob.questionBlock}>
        <Text style={ob.question}>How big is your home library?</Text>
        <Text style={ob.sub}>Roughly how many books do you own?</Text>
      </View>

      <View style={ob.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected === i;
          return (
            <TouchableOpacity key={opt.label} style={[ob.row, active && ob.rowActive]} onPress={() => setSelected(i)} activeOpacity={0.8}>
              <Text style={[ob.rowLabel, active && ob.rowLabelActive]}>{opt.label}</Text>
              <Text style={ob.rowEmoji}>{opt.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={ob.footer}>
        {selected !== null && (
          <Animated.View style={{ opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <TouchableOpacity style={ob.cta} onPress={() => { if (selected !== null) setLibrarySize(OPTIONS[selected].label); router.push('/onboarding/mirror'); }} activeOpacity={0.9}>
              <Text style={ob.ctaText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const ob = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  progressSeg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  progressSegActive: { backgroundColor: colors.accent },

  questionBlock: { paddingHorizontal: 22, paddingTop: 32, paddingBottom: 28 },
  question: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1, marginBottom: 10 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3 },

  options: { paddingHorizontal: 22, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 20, paddingVertical: 20, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  rowActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1.5 },
  rowLabel: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  rowLabelActive: { color: colors.ink1 },
  rowEmoji: { fontSize: 22 },

  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 12 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
