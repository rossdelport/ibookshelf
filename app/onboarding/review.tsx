import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const TOTAL_STEPS  = 11;
const CURRENT_STEP = 8; // segments 0–8 filled (screen 10)

const STAR_D = 'M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.98 6.09 20.34l1.13-6.57L2.45 9.12l6.6-.96L12 2.2z';

function Chevron() {
  return (
    <View style={rv.chevronWrap}>
      <View style={rv.chevronArm1} />
      <View style={rv.chevronArm2} />
    </View>
  );
}

/** Amber star that pops in with a staggered delay (design `revPop`) */
function Star({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.bezier(0.22, 1.4, 0.4, 1),
      useNativeDriver: true,
    }).start();
  }, [scale, delay]);
  return (
    <Animated.View style={{ opacity: scale, transform: [{ scale }] }}>
      <Svg width={40} height={40} viewBox="0 0 24 24"><Path d={STAR_D} fill={AMBER} /></Svg>
    </Animated.View>
  );
}

export default function ReviewScreen() {
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
        <Text style={rv.title}>Loving iBookshelf{'\n'}so far?</Text>
        <Text style={rv.sub}>A 5-star review helps fellow readers find their sanctuary.</Text>
      </View>

      {/* ── Body: review card ────────────────────────── */}
      <View style={rv.body}>
        <View style={rv.card}>
          <View style={rv.emblem}>
            <Image source={require('../../assets/images/logo_fable.png')} style={rv.emblemImg} resizeMode="contain" />
          </View>
          <Text style={rv.q}>Rate your experience</Text>
          <Text style={rv.cap}>Tap to rate iBookshelf on the App Store</Text>

          <View style={rv.stars}>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} delay={50 + i * 90} />)}
          </View>
          <Text style={rv.tap}>Tap a star</Text>

          <View style={rv.social}>
            <View style={rv.avs}>
              <Image source={require('../../assets/images/av_maya.png')} style={[rv.av, { marginLeft: 0 }]} resizeMode="cover" />
              <Image source={require('../../assets/images/av_priya.png')} style={rv.av} resizeMode="cover" />
              <Image source={require('../../assets/images/av_noor.png')} style={rv.av} resizeMode="cover" />
            </View>
            <Text style={rv.socialTxt}><Text style={rv.socialB}>4.9 ★</Text> · loved by{'\n'}12,000+ readers</Text>
          </View>
        </View>
      </View>

      {/* ── Footer ───────────────────────────────────── */}
      <View style={rv.footer}>
        <TouchableOpacity style={rv.cta} onPress={() => router.push('/onboarding/circle')} activeOpacity={0.85}>
          <Text style={rv.ctaText}>Leave a 5-star review  →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/onboarding/circle')} activeOpacity={0.7}>
          <Text style={rv.tinyLink}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const rv = StyleSheet.create({
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

  // ── Head (§3 ob-title / ob-sub — left-aligned)
  head: { paddingHorizontal: 22, marginTop: 26 },
  title: { fontSize: 27, fontWeight: '800', color: INK, letterSpacing: -0.5, lineHeight: 31 },
  sub:   { fontSize: 14.5, fontWeight: '500', color: '#8a7d6d', lineHeight: 21, marginTop: 9 },

  // ── Body
  body: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },

  // Review card
  card: {
    backgroundColor: WHITE, borderRadius: 22, paddingTop: 28, paddingHorizontal: 22, paddingBottom: 26,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', alignItems: 'center',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 2,
  },
  emblem: {
    width: 66, height: 66, borderRadius: 18, backgroundColor: WHITE, padding: 9,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 3,
  },
  emblemImg: { width: '100%', height: '100%', borderRadius: 11 },
  q: { fontSize: 19, fontWeight: '800', color: INK, letterSpacing: -0.3, marginTop: 16, marginBottom: 3 },
  cap: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13.5, color: MUTE, textAlign: 'center' },

  stars: { flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 20, marginBottom: 4 },
  tap: { fontSize: 12.5, fontWeight: '800', color: '#C99A4C', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8 },

  social: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#F6EFE2', borderRadius: 999, paddingVertical: 9, paddingLeft: 12, paddingRight: 16, marginTop: 22 },
  avs: { flexDirection: 'row' },
  av: { width: 26, height: 26, borderRadius: 13, marginLeft: -8, borderWidth: 2, borderColor: '#F6EFE2' },
  socialTxt: { fontSize: 12.5, fontWeight: '700', color: '#6b6052', lineHeight: 16 },
  socialB: { color: INK, fontWeight: '800' },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  tinyLink: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: MUTE, marginTop: 14 },
});
