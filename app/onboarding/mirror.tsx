import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 1;

function Chevron() {
  return (
    <View style={mir.chevronWrap}>
      <View style={mir.chevronArm1} />
      <View style={mir.chevronArm2} />
    </View>
  );
}

export default function MirrorScreen() {
  return (
    <SafeAreaView style={mir.safe}>
      <View style={mir.topbar}>
        <TouchableOpacity style={mir.backBtn} onPress={() => router.back()} activeOpacity={0.7}><Chevron /></TouchableOpacity>
        <View style={mir.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[mir.progressSeg, i <= CURRENT_STEP && mir.progressSegActive]} />
          ))}
        </View>
      </View>

      <View style={mir.body}>
        <Text style={mir.headline}>You own more books than you can remember.</Text>

        <View style={mir.statCard}>
          <View style={mir.statBar} />
          <Text style={mir.statText}>
            {'1 in 5 book lovers has '}
            <Text style={mir.statBold}>bought a book they already owned</Text>
            {' — simply because they forgot.'}
          </Text>
        </View>

        <View style={mir.saveCard}>
          <Text style={mir.saveAmount}>$100+</Text>
          <Text style={mir.saveLabel}>
            {'is what readers typically waste on '}
            <Text style={mir.saveBold}>duplicate books</Text>
            {' — money Fable helps you keep.'}
          </Text>
        </View>

        <Text style={mir.tagline}>Fable remembers, so you never buy twice.</Text>
      </View>

      <View style={mir.footer}>
        <TouchableOpacity style={mir.cta} onPress={() => router.push('/onboarding/genres')} activeOpacity={0.9}>
          <Text style={mir.ctaText}>I'm ready</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const mir = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  progressSeg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  progressSegActive: { backgroundColor: colors.accent },

  body: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 20, paddingBottom: 32 },
  headline: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1 },

  statCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  statBar: { width: 4, backgroundColor: colors.accent },
  statText: { flex: 1, fontFamily: fonts.regular, ...ty.body, color: colors.ink2, paddingVertical: 18, paddingHorizontal: 16 },
  statBold: { fontFamily: fonts.semibold, color: colors.ink1 },

  saveCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.chip, borderRadius: radius.card, paddingVertical: 18, paddingHorizontal: 18 },
  saveAmount: { fontFamily: fonts.semibold, fontSize: 36, color: colors.ink1, letterSpacing: -1 },
  saveLabel: { flex: 1, fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  saveBold: { fontFamily: fonts.semibold, color: colors.ink1 },

  tagline: { fontFamily: fonts.serifItalic, ...ty.editorial, color: colors.ink2 },

  footer: { paddingHorizontal: 22, paddingBottom: 16 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
