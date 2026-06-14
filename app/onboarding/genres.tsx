import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/userStore';
import { GENRES } from '../../constants/genres';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 2;

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
      <View style={gen.topbar}>
        <TouchableOpacity style={gen.backBtn} onPress={() => router.back()} activeOpacity={0.7}><Chevron /></TouchableOpacity>
        <View style={gen.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[gen.progressSeg, i <= CURRENT_STEP && gen.progressSegActive]} />
          ))}
        </View>
      </View>

      <View style={gen.questionBlock}>
        <Text style={gen.question}>What do you love to read?</Text>
        <Text style={gen.sub}>Pick as many as you like, and we'll personalise your experience around them.</Text>
      </View>

      <View style={gen.chipWrap}>
        {GENRES.map(({ label, emoji }) => {
          const active = selected.includes(label);
          return (
            <TouchableOpacity key={label} style={[gen.chip, active && gen.chipActive]} onPress={() => { Haptics.selectionAsync(); toggleGenre(label); }} activeOpacity={0.8}>
              <Text style={gen.chipEmoji}>{emoji}</Text>
              <Text style={[gen.chipLabel, active && gen.chipLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={gen.footer}>
        <TouchableOpacity style={gen.cta} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/onboarding/avatar'); }} activeOpacity={0.9}>
          <Text style={gen.ctaText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const gen = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  progressSeg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  progressSegActive: { backgroundColor: colors.accent },

  questionBlock: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 24, gap: 10 },
  question: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3 },

  chipWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, gap: 10, alignContent: 'flex-start' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingVertical: 11, paddingHorizontal: 16, ...shadow.cardSoft },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipEmoji: { fontSize: 17 },
  chipLabel: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink1 },
  chipLabelActive: { color: colors.accentText },

  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 12 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
