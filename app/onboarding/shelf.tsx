import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { ANIMALS } from '../../constants/animals';
import { AvatarFace } from '../../components/AvatarFace';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const AMBER  = '#E8A838';
const WHITE  = '#FFFFFF';
// Dark screen background — very dark warm brown (§2 Dark surface family)
const DARK   = '#1E1408';

const TOTAL_STEPS  = 10;
const CURRENT_STEP = 6; // segments 0–6 filled (screen 07)

// Fallback appearance if the avatar builder was skipped (mirrors avatar.tsx defaults)
const DEFAULT_AVATAR = { skin: '#E8A87C', hairStyle: 1, hairColor: '#5C3317' };

const AVATAR_SIZE = 132;

export default function ShelfScreen() {
  const { profile } = useUserStore();
  const soulAnimal = ANIMALS.find((a) => a.name === profile.soulAnimal);
  const avatar = profile.avatar ?? DEFAULT_AVATAR;

  return (
    <SafeAreaView style={sh.safe}>
      {/* ── Topbar (dark variant) ───────────────────────── */}
      <View style={sh.topbar}>
        <TouchableOpacity style={sh.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={sh.chevronWrap}>
            <View style={sh.chevronArm1} />
            <View style={sh.chevronArm2} />
          </View>
        </TouchableOpacity>

        <View style={sh.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[sh.seg, i <= CURRENT_STEP && sh.segActive]} />
          ))}
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────── */}
      <View style={sh.body}>
        {/* Title — Lora serif, white, §3 "Onboarding title (serif variant)" */}
        <Text style={sh.title}>Your shelf is ready.</Text>
        <Text style={sh.sub}>Now let's fill it.</Text>

        {/* ── Avatar + soul animal, big and side by side ─── */}
        <View style={sh.pairWrap}>
          {/* Warm amber glow behind the pair */}
          <View style={sh.glow} />

          <View style={sh.pairRow}>
            {/* Reader avatar */}
            <View style={sh.unit}>
              <View style={sh.avatarRing}>
                <AvatarFace
                  skin={avatar.skin}
                  hairStyle={avatar.hairStyle}
                  hairColor={avatar.hairColor}
                  size={AVATAR_SIZE}
                />
              </View>
              <Text style={sh.unitLabel}>You</Text>
            </View>

            {/* Soul animal */}
            <View style={sh.unit}>
              <View style={sh.soulCircle}>
                <Text style={sh.soulEmoji}>{soulAnimal?.emoji ?? '📖'}</Text>
              </View>
              <Text style={sh.unitLabel}>{soulAnimal?.name ?? 'Your soul'}</Text>
            </View>
          </View>
        </View>

        <Text style={sh.caption}>Your theme, your world. Customise it anytime.</Text>
      </View>

      {/* ── Footer CTA ─────────────────────────────────── */}
      <View style={sh.footer}>
        <TouchableOpacity
          style={sh.cta}
          onPress={() => router.push('/onboarding/signup')}
          activeOpacity={0.85}
        >
          <Text style={sh.ctaText}>Let's go  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const sh = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK },

  // ── Topbar (dark)
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: WHITE, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: WHITE, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress (dark variant — inactive segs are white at low opacity)
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg:         { flex: 1, height: 3.5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  segActive:   { backgroundColor: AMBER },

  // ── Body
  body: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 28 },

  // Title — Georgia (Lora fallback), white, §3 onboarding serif
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'Georgia',
    color: WHITE,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 15,
    fontWeight: '600',
    color: AMBER,
    textAlign: 'center',
    marginTop: -18,
  },

  // ── Avatar + soul pairing
  pairWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  // Soft radial-ish amber glow behind the pair (approximated with a blurred shadow circle)
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(232,168,56,0.10)',
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 50,
    elevation: 0,
  },
  pairRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 22 },

  unit: { alignItems: 'center', gap: 12 },
  unitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.2,
  },

  // Avatar with white ring (§ "Avatars always get a white ring")
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: WHITE,
    overflow: 'hidden',
    backgroundColor: '#F5E6CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },

  // Soul animal circle — warm dark fill, amber ring, big emoji
  soulCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#2E2114',
    borderWidth: 3,
    borderColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  soulEmoji: { fontSize: 72 },

  // Caption
  caption: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  cta: {
    backgroundColor: AMBER,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    shadowColor: '#E29A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
