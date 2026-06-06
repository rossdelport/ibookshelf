import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ANIMALS } from '../../constants/animals';
import { useUserStore } from '../../store/userStore';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

export default function SoulDetailScreen() {
  const { animal: animalName } = useLocalSearchParams<{ animal: string }>();
  const { setSoulAnimal } = useUserStore();
  const insets = useSafeAreaInsets();

  const animal = ANIMALS.find((a) => a.name === animalName);

  // Fallback — should never happen in practice
  if (!animal) {
    router.back();
    return null;
  }

  function confirm() {
    setSoulAnimal(animal!.name);
    // Replace so back-stack doesn't return here after confirming
    router.replace('/(tabs)');
  }

  return (
    // Full-screen scrim — tap outside card to dismiss
    <TouchableWithoutFeedback onPress={() => router.back()}>
      <View style={sd.scrim}>
        {/* Card — stop tap propagation so card doesn't dismiss itself */}
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={[sd.card, { paddingBottom: Math.max(insets.bottom, 24) }]}>

            {/* ── Emoji tile ─────────────────────────────── */}
            <View style={sd.tile}>
              <Text style={sd.tileEmoji}>{animal.emoji}</Text>
            </View>

            {/* ── Kicker — §3: 12.5px / 800 / uppercase / letter-spacing 1.4 / #C99A4C */}
            <Text style={sd.kicker}>{animal.archetype}</Text>

            {/* ── Animal name — Lora serif §3 "Onboarding title (serif variant)" */}
            <Text style={sd.name}>{animal.name}</Text>

            {/* ── Description — body text §3: 14.5px / 500 / line-height 1.5 */}
            <Text style={sd.desc}>{animal.description}</Text>

            {/* ── CTA: This is me (amber ob-cta §5) */}
            <TouchableOpacity style={sd.cta} onPress={confirm} activeOpacity={0.85}>
              <Text style={sd.ctaText}>This is me  ✓</Text>
            </TouchableOpacity>

            {/* ── Ghost: Keep exploring (§5 ghost variant) */}
            <TouchableOpacity style={sd.ghost} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={sd.ghostText}>← Keep exploring</Text>
            </TouchableOpacity>

          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const sd = StyleSheet.create({
  // Dark scrim fills the whole screen
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(26,16,8,0.72)',
    justifyContent: 'flex-end',
  },

  // Floating card — Paper bg, rounded top corners, big card radius (§4: 22px)
  card: {
    backgroundColor: '#FAF8F3',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 0,
    // Subtle lift shadow
    shadowColor: '#1A1008',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },

  // ── Emoji tile — warm sub-surface (#F6EFE2), large rounded square (§5)
  tile: {
    width: 108,
    height: 108,
    borderRadius: 26,
    backgroundColor: '#F6EFE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tileEmoji: { fontSize: 64 },

  // ── Kicker — §3 kicker/eyebrow style
  kicker: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#C99A4C',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },

  // ── Name — Lora serif §3 "Onboarding title"
  name: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'Georgia',
    color: INK,
    letterSpacing: -0.3,
    marginBottom: 16,
    textAlign: 'center',
  },

  // ── Description — §3 body text
  desc: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#463E33',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },

  // ── CTA button — amber ob-cta §5
  cta: {
    alignSelf: 'stretch',
    backgroundColor: AMBER,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    marginBottom: 12,
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

  // ── Ghost button — §5 ghost variant: white bg, brown text, hairline border
  ghost: {
    alignSelf: 'stretch',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(139,94,60,0.18)',
    paddingVertical: 18,
    alignItems: 'center',
  },
  ghostText: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    letterSpacing: 0.1,
  },
});
