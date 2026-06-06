import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK     = '#332C24';
const MUTE    = '#A89A88';
const AMBER   = '#E8A838';
const PAPER   = '#FAF8F3';
const WHITE   = '#FFFFFF';
const GREEN   = '#5BA66E';

const TOTAL_STEPS  = 10;
const CURRENT_STEP = 8; // segments 0–8 filled (screen 09)

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={sc.chevronWrap}>
      <View style={sc.chevronArm1} />
      <View style={sc.chevronArm2} />
    </View>
  );
}

/** Small check glyph built from two rotated bars (badge tick) */
function Check({ color = WHITE, size = 10 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', left: 0, bottom: size * 0.18,
        width: size * 0.42, height: 2, borderRadius: 1, backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
      <View style={{
        position: 'absolute', left: size * 0.26, bottom: size * 0.18,
        width: size * 0.72, height: 2, borderRadius: 1, backgroundColor: color,
        transform: [{ rotate: '-45deg' }],
      }} />
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const [viewH, setViewH] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  // Loop the scan line up and down the viewport (DESIGN.md §4 "scanner line loop")
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [sweep]);

  const lineY = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(viewH - 32, 0)],
  });

  return (
    <SafeAreaView style={sc.safe}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={sc.topbar}>
        <TouchableOpacity style={sc.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={sc.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[sc.seg, i <= CURRENT_STEP && sc.segActive]} />
          ))}
        </View>
      </View>

      {/* ── Head ─────────────────────────────────────── */}
      <View style={sc.head}>
        <Text style={sc.title}>Grab the book closest{'\n'}to you right now.</Text>
        <Text style={sc.sub}>Point your camera at the barcode and we'll do the rest.</Text>
      </View>

      {/* ── Body ─────────────────────────────────────── */}
      <View style={sc.body}>
        {/* Camera viewport */}
        <View style={sc.scanView} onLayout={(e) => setViewH(e.nativeEvent.layout.height)}>
          <Image source={require('../../assets/images/cover.png')} style={sc.scanBook} resizeMode="cover" />

          {/* Corner brackets */}
          <View style={[sc.corner, sc.cornerTL]} />
          <View style={[sc.corner, sc.cornerTR]} />
          <View style={[sc.corner, sc.cornerBL]} />
          <View style={[sc.corner, sc.cornerBR]} />

          {/* Sweeping scan line */}
          <Animated.View style={[sc.scanLine, { transform: [{ translateY: lineY }] }]} />
        </View>

        {/* Result card */}
        <View style={sc.result}>
          <Image source={require('../../assets/images/cover.png')} style={sc.resultCover} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={sc.resultTitle}>Fourth Wing</Text>
            <Text style={sc.resultAuthor}>Rebecca Yarros</Text>
            <View style={sc.badge}>
              <Check size={10} />
              <Text style={sc.badgeText}>Added to your shelf</Text>
            </View>
          </View>
        </View>

        <Text style={sc.done}>Beautiful. Your first book is home.</Text>
      </View>

      {/* ── Footer ───────────────────────────────────── */}
      <View style={sc.footer}>
        <TouchableOpacity style={sc.cta} onPress={() => router.push('/onboarding/circle')} activeOpacity={0.85}>
          <Text style={sc.ctaText}>Continue  →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/onboarding/circle')} activeOpacity={0.7}>
          <Text style={sc.tinyLink}>I'll add books later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
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

  // ── Head (§3 ob-title / ob-sub)
  head: { paddingHorizontal: 22, marginTop: 26 },
  title: { fontSize: 27, fontWeight: '800', color: INK, letterSpacing: -0.5, lineHeight: 30 },
  sub:   { fontSize: 14.5, fontWeight: '500', color: '#8a7d6d', lineHeight: 21, marginTop: 9 },

  // ── Body
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 20 },

  // Camera viewport — dark warm, rounded, 4:3
  scanView: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#211A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBook: {
    width: 86, height: 124, borderRadius: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.5, shadowRadius: 30,
  },

  // Corner brackets — amber L-shapes
  corner: { position: 'absolute', width: 30, height: 30, borderColor: AMBER },
  cornerTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },

  // Sweeping scan line (starts at top inset, animated down)
  scanLine: {
    position: 'absolute',
    top: 16, left: 16, right: 16, height: 2,
    backgroundColor: '#F0BC5A',
    shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6,
  },

  // ── Result card (§4 row)
  result: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16,
    padding: 14, borderRadius: 16, backgroundColor: WHITE,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 2,
  },
  resultCover: {
    width: 46, height: 68, borderRadius: 4,
    shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.24, shadowRadius: 7,
  },
  resultTitle:  { fontSize: 15.5, fontWeight: '800', color: INK },
  resultAuthor: { fontSize: 12.5, fontWeight: '600', color: MUTE, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 1 },

  // Green "added" badge
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    marginTop: 6, backgroundColor: GREEN, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9,
  },
  badgeText: { fontSize: 11.5, fontWeight: '800', color: WHITE },

  // Done line — Lora serif
  done: { textAlign: 'center', fontFamily: 'Georgia', fontWeight: '600', fontSize: 18, color: INK, marginTop: 18 },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText:  { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  tinyLink: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: MUTE, marginTop: 14 },
});
