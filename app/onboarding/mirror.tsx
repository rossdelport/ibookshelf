import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK    = '#332C24';
const BROWN  = '#8B5E3C';
const AMBER  = '#E8A838';
const PAPER  = '#FAF8F3';
const WHITE  = '#FFFFFF';

const TOTAL_STEPS  = 11;
const CURRENT_STEP = 1; // segments 0–1 filled (screen 03)

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
      {/* ── Topbar ─────────────────────────────────────── */}
      <View style={mir.topbar}>
        <TouchableOpacity
          style={mir.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Chevron />
        </TouchableOpacity>

        <View style={mir.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[mir.progressSeg, i <= CURRENT_STEP && mir.progressSegActive]}
            />
          ))}
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────── */}
      <View style={mir.body}>
        {/* Hero headline */}
        <Text style={mir.headline}>
          You own more books{'\n'}than you can{'\n'}remember.
        </Text>

        {/* Stat blockquote card */}
        <View style={mir.statCard}>
          <View style={mir.statBar} />
          <Text style={mir.statText}>
            {'1 in 5 book lovers has '}
            <Text style={mir.statBold}>bought a book they already owned</Text>
            {' — simply because they forgot.'}
          </Text>
        </View>

        {/* Savings highlight — concrete cost of buying duplicates */}
        <View style={mir.saveCard}>
          <Text style={mir.saveAmount}>$100+</Text>
          <Text style={mir.saveLabel}>
            {'is what readers typically waste on '}
            <Text style={mir.saveBold}>duplicate books</Text>
            {' — money iBookshelf helps you keep.'}
          </Text>
        </View>

        {/* Tagline */}
        <Text style={mir.tagline}>iBookshelf remembers, so you never buy twice.</Text>
      </View>

      {/* ── Footer CTA ─────────────────────────────────── */}
      <View style={mir.footer}>
        <TouchableOpacity
          style={mir.cta}
          onPress={() => router.push('/onboarding/genres')}
          activeOpacity={0.85}
        >
          <Text style={mir.ctaText}>I'm ready  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const mir = StyleSheet.create({
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

  // ── Body
  body: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 32,
  },

  // Hero headline — large Nunito 800, §3 H1 scale pushed slightly bigger
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
    lineHeight: 38,
  },

  // Blockquote stat card — white surface with amber left accent bar
  statCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statBar: {
    width: 4,
    backgroundColor: AMBER,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  statText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#463E33',
    lineHeight: 23,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  statBold: {
    fontWeight: '800',
    color: INK,
  },

  // ── Savings highlight — amber-pale callout (§2 amber pale + text-on-pale)
  saveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FBF1DC',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(232,168,56,0.35)',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  // Big stat number — Nunito 800 with negative tracking (§3)
  saveAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#C0851E',
    letterSpacing: -1,
  },
  saveLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#8a6a32',
    lineHeight: 19,
  },
  saveBold: {
    fontWeight: '800',
    color: '#C0851E',
  },

  // "Fable changes that." — Brown secondary, §2 color token
  tagline: {
    fontSize: 15,
    fontWeight: '700',
    color: BROWN,
  },

  // ── Footer CTA — ob-cta variant from §5
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
