import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 8; // last dotted step; the All-set finale has no dots

const STAR_D = 'M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.98 6.09 20.34l1.13-6.57L2.45 9.12l6.6-.96L12 2.2z';

function Chevron() {
  return (
    <View style={rv.chevronWrap}>
      <View style={rv.chevronArm1} />
      <View style={rv.chevronArm2} />
    </View>
  );
}

/** Tappable star that pops in with a staggered delay. */
function Star({ delay, filled, onPress }: { delay: number; filled: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: 500, delay, easing: Easing.bezier(0.22, 1.4, 0.4, 1), useNativeDriver: true }).start();
  }, [scale, delay]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={6}>
      <Animated.View style={{ opacity: scale, transform: [{ scale }] }}>
        <Svg width={42} height={42} viewBox="0 0 24 24">
          <Path d={STAR_D} fill={filled ? colors.star : '#DCD6CB'} />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ReviewScreen() {
  const [rating, setRating] = useState(0);

  // Proceeds into the app. Rewired through the All-set page in the next step.
  const proceed = () => router.replace('/(tabs)');

  const askForReview = async (stars: number) => {
    setRating(stars);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
    } catch {
      // Store review unavailable (e.g. simulator / not yet published) — ignore.
    }
  };

  return (
    <SafeAreaView style={rv.safe}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={rv.topbar}>
        <TouchableOpacity style={rv.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={rv.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[rv.seg, i <= CURRENT_STEP && rv.segActive]} />
          ))}
        </View>
      </View>

      {/* ── Head ─────────────────────────────────────── */}
      <View style={rv.head}>
        <Text style={rv.title}>Loving Fable so far?</Text>
        <Text style={rv.sub}>A quick rating helps fellow readers find the app and keep it growing.</Text>
      </View>

      {/* ── Body: review card ────────────────────────── */}
      <View style={rv.body}>
        <View style={rv.card}>
          <View style={rv.emblem}>
            <Image source={require('../../assets/images/logo_fable.png')} style={rv.emblemImg} resizeMode="contain" />
          </View>
          <Text style={rv.q}>Rate your experience</Text>
          <Text style={rv.cap}>Tap a star to rate Fable on the App Store</Text>

          <View style={rv.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} delay={50 + i * 90} filled={i < rating} onPress={() => askForReview(i + 1)} />
            ))}
          </View>

          <View style={rv.social}>
            <View style={rv.avs}>
              <Image source={require('../../assets/images/av_maya.png')} style={[rv.av, { marginLeft: 0 }]} resizeMode="cover" />
              <Image source={require('../../assets/images/av_priya.png')} style={rv.av} resizeMode="cover" />
              <Image source={require('../../assets/images/av_noor.png')} style={rv.av} resizeMode="cover" />
            </View>
            <Text style={rv.socialTxt}><Text style={rv.socialB}>4.9 ★</Text>  loved by{'\n'}12,000+ readers</Text>
          </View>
        </View>
      </View>

      {/* ── Footer ───────────────────────────────────── */}
      <View style={rv.footer}>
        <TouchableOpacity style={rv.cta} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); proceed(); }} activeOpacity={0.9}>
          <Text style={rv.ctaText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={proceed} activeOpacity={0.7}>
          <Text style={rv.tinyLink}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const rv = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

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

  // ── Head
  head: { paddingHorizontal: 22, marginTop: 24 },
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginTop: 10 },

  // ── Body
  body: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.sheet, paddingTop: 28, paddingHorizontal: 22, paddingBottom: 26, borderWidth: 1, borderColor: colors.line, alignItems: 'center', ...shadow.card },
  emblem: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.card, padding: 9, alignItems: 'center', justifyContent: 'center', ...shadow.cardSoft },
  emblemImg: { width: '100%', height: '100%', borderRadius: 11 },
  q: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1, marginTop: 16, marginBottom: 4 },
  cap: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink3, textAlign: 'center' },

  stars: { flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 20, marginBottom: 4 },

  social: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.chip, borderRadius: 999, paddingVertical: 9, paddingLeft: 12, paddingRight: 16, marginTop: 22 },
  avs: { flexDirection: 'row' },
  av: { width: 26, height: 26, borderRadius: 13, marginLeft: -8, borderWidth: 2, borderColor: colors.chip },
  socialTxt: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink2, lineHeight: 16 },
  socialB: { color: colors.ink1, fontFamily: fonts.semibold },

  // ── Footer
  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  tinyLink: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.ink3, marginTop: 14 },
});
