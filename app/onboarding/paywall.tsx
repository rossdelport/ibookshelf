import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

const TOTAL_STEPS  = 11;
const CURRENT_STEP = 10; // all segments filled (screen 11 — final)

// ── Content (from design ObPaywall) ────────────────────────────────────────
const THEMES: { key: string; label: string; colors: [string, string] }[] = [
  { key: 'fantasy', label: 'Dark Fantasy',     colors: ['#2A1F44', '#4A2A52'] },
  { key: 'romance', label: 'Pink Romance',     colors: ['#7A3B57', '#C66A82'] },
  { key: 'leather', label: 'Leather Business', colors: ['#5A3A1E', '#8A5A2E'] },
];

const FEATURES = [
  'Premium shelf themes',
  'Soul animal variants: golden, obsidian, silver',
  'Full community: post, comment, book clubs',
  'Shareable Wrapped cards, no watermark',
  'Advanced reading insights',
  'Animated lock-screen widgets',
  'Unlimited books, shelves & notes',
];

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={pw.chevronWrap}>
      <View style={pw.chevronArm1} />
      <View style={pw.chevronArm2} />
    </View>
  );
}

/** Check glyph built from two rotated bars */
function Check({ color = WHITE, size = 11 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', left: 0, bottom: size * 0.2,
        width: size * 0.42, height: 2, borderRadius: 1, backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
      <View style={{
        position: 'absolute', left: size * 0.26, bottom: size * 0.2,
        width: size * 0.72, height: 2, borderRadius: 1, backgroundColor: color,
        transform: [{ rotate: '-45deg' }],
      }} />
    </View>
  );
}

/** Themed shelf preview card — gradient bg with two faux planks + label */
function ThemeCard({ label, colors }: { label: string; colors: [string, string] }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={pw.theme}>
      <View style={[pw.plank, { bottom: 38 }]} />
      <View style={[pw.plank, { bottom: 18 }]} />
      <Text style={pw.themeLabel}>{label}</Text>
    </LinearGradient>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <LinearGradient colors={['#FBE9C9', '#FAF3E6']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} style={pw.fill}>
      <SafeAreaView style={pw.fill}>
        {/* ── Topbar ─────────────────────────────────── */}
        <View style={pw.topbar}>
          <TouchableOpacity style={pw.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Chevron />
          </TouchableOpacity>
          <View style={pw.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[pw.seg, i <= CURRENT_STEP && pw.segActive]} />
            ))}
          </View>
        </View>

        {/* ── Head (centered serif) ──────────────────── */}
        <View style={pw.head}>
          <Text style={pw.title}>Unlock the full{'\n'}iBookshelf experience.</Text>
        </View>

        {/* ── Scrollable content ─────────────────────── */}
        <ScrollView style={pw.body} showsVerticalScrollIndicator={false} contentContainerStyle={pw.bodyContent}>
          {/* Theme carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={pw.themesRow}
            contentContainerStyle={pw.themesContent}
          >
            {THEMES.map((t) => (
              <ThemeCard key={t.key} label={t.label} colors={t.colors} />
            ))}
          </ScrollView>

          {/* Feature grid (2 columns) */}
          <View style={pw.features}>
            {FEATURES.map((f) => (
              <View key={f} style={pw.feat}>
                <View style={pw.featCheck}><Check size={11} /></View>
                <Text style={pw.featText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          <View style={pw.plans}>
            <TouchableOpacity
              style={[pw.plan, plan === 'monthly' && pw.planSel]}
              onPress={() => setPlan('monthly')}
              activeOpacity={0.9}
            >
              <Text style={pw.planK}>Monthly</Text>
              <Text style={pw.planAmt}>$9.99 <Text style={pw.planAmtUnit}>/mo</Text></Text>
              <View style={[pw.planMark, plan === 'monthly' && pw.planMarkOn]}>
                {plan === 'monthly' && <Check size={12} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[pw.plan, plan === 'yearly' && pw.planSel]}
              onPress={() => setPlan('yearly')}
              activeOpacity={0.9}
            >
              <View style={pw.planBadge}><Text style={pw.planBadgeText}>7 DAYS FREE</Text></View>
              <Text style={pw.planK}>Yearly</Text>
              <Text style={pw.planAmt}>$59.99</Text>
              <View style={[pw.planMark, plan === 'yearly' && pw.planMarkOn]}>
                {plan === 'yearly' && <Check size={12} />}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Footer ─────────────────────────────────── */}
        <View style={pw.footer}>
          <TouchableOpacity style={pw.cta} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
            <Text style={pw.ctaText}>Start my 7-day free trial  →</Text>
          </TouchableOpacity>
          <Text style={pw.footNote}>Cancel anytime. No charge until trial ends.</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.7}>
            <Text style={pw.tinyLink}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const pw = StyleSheet.create({
  fill: { flex: 1 },

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

  // ── Head — centered Lora serif (§3 ob-title.serif)
  head: { paddingHorizontal: 22, marginTop: 24, alignItems: 'flex-start' },
  title: {
    fontSize: 30, fontWeight: '600', fontFamily: 'Georgia', color: INK,
    letterSpacing: -0.4, lineHeight: 36,
  },

  // ── Scroll body
  body: { flex: 1, marginTop: 4 },
  bodyContent: { paddingHorizontal: 22, paddingBottom: 8 },

  // ── Theme carousel
  themesRow: { marginTop: 18, marginHorizontal: -22 },
  themesContent: { paddingHorizontal: 22, gap: 12, paddingBottom: 4 },
  theme: {
    width: 132, height: 150, borderRadius: 18, padding: 12,
    overflow: 'hidden', justifyContent: 'flex-end',
    shadowColor: '#5A3C23', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 5,
  },
  plank: {
    position: 'absolute', left: 10, right: 10, height: 9, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.22)',
  },
  themeLabel: {
    fontSize: 13, fontWeight: '800', color: WHITE,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  // ── Feature grid (2 cols)
  features: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, rowGap: 9, columnGap: 14 },
  feat: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: '43%', flexGrow: 1, flexBasis: '43%' },
  featCheck: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: AMBER,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  featText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#4a4036', lineHeight: 16 },

  // ── Plans (2 cols)
  plans: { flexDirection: 'row', gap: 12, marginTop: 30 },
  plan: {
    flex: 1, position: 'relative', backgroundColor: WHITE,
    borderWidth: 2, borderColor: 'rgba(139,94,60,0.16)', borderRadius: 18,
    paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14,
  },
  planSel: {
    borderColor: INK, backgroundColor: '#FFFBF2',
    shadowColor: '#5A3C23', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 6,
  },
  planK:       { fontSize: 15, fontWeight: '800', color: INK },
  planAmt:     { fontSize: 16, fontWeight: '800', color: INK, marginTop: 3 },
  planAmtUnit: { fontSize: 12, fontWeight: '600', color: MUTE },
  planMark: {
    position: 'absolute', top: 16, right: 16, width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#DBD0BD', alignItems: 'center', justifyContent: 'center',
  },
  planMarkOn: { borderWidth: 0, backgroundColor: INK },
  planBadge: {
    position: 'absolute', top: -11, right: 14, backgroundColor: INK,
    borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10,
  },
  planBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, color: WHITE },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText:  { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  footNote: { textAlign: 'center', fontSize: 12.5, fontWeight: '600', color: MUTE, marginTop: 14 },
  tinyLink: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: MUTE, marginTop: 12 },
});
