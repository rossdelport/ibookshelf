import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ANIMALS } from '../../constants/animals';
import { useUserStore } from '../../store/userStore';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';

export default function SoulDetailScreen() {
  const { animal: animalName } = useLocalSearchParams<{ animal: string }>();
  const { setSoulAnimal } = useUserStore();

  // Drives both the scrim fade and the card rotate/scale/opacity
  const anim = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const animal = ANIMALS.find((a) => a.name === animalName);

  // Animate the card in (rotate + expand) on mount
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 440,
      easing: Easing.bezier(0.22, 1.4, 0.4, 1), // overshoot pop (DESIGN.md §4)
      useNativeDriver: true,
    }).start();
  }, [anim]);

  // Fallback — should never happen in practice
  if (!animal) {
    router.back();
    return null;
  }

  /** Reverse the same rotate/expand, then pop the modal (when NOT chosen) */
  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.7, 0.2),
      useNativeDriver: true,
    }).start(() => router.back());
  }

  function confirm() {
    setSoulAnimal(animal!.name);
    // Chosen — go forward (no reverse animation)
    router.replace('/onboarding/shelf');
  }

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const rotate  = anim.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] });
  const cardOpacity  = anim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 1] });
  const scrimOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={sd.root}>
      {/* ── Warm radial scrim — tap outside to dismiss ─── */}
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: scrimOpacity }]}>
          <LinearGradient
            colors={['rgba(74,46,20,0.74)', 'rgba(38,26,14,0.93)']}
            start={{ x: 0.5, y: 0.15 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* ── Centered modal card ────────────────────────── */}
      <Animated.View
        style={[
          sd.card,
          { opacity: cardOpacity, transform: [{ scale }, { rotate }] },
        ]}
      >
        {/* Emoji tile — amber-pale radial gradient (§5) */}
        <View style={sd.tileWrap}>
          <LinearGradient
            colors={['#FBEACB', '#EFC471']}
            start={{ x: 0.5, y: 0.1 }}
            end={{ x: 0.5, y: 1 }}
            style={sd.tile}
          >
            <Text style={sd.tileEmoji}>{animal.emoji}</Text>
          </LinearGradient>
        </View>

        {/* Kicker — §3: 12.5/800/uppercase/letter-spacing 1.4/#C99A4C */}
        <Text style={sd.kicker}>{animal.archetype}</Text>

        {/* Name — Lora serif §3 onboarding title */}
        <Text style={sd.name}>{animal.name}</Text>

        {/* Description */}
        <Text style={sd.desc}>{animal.description}</Text>

        {/* Buttons */}
        <View style={sd.btns}>
          <TouchableOpacity style={sd.cta} onPress={confirm} activeOpacity={0.85}>
            <Text style={sd.ctaText}>This is me  ✓</Text>
          </TouchableOpacity>

          <TouchableOpacity style={sd.ghost} onPress={dismiss} activeOpacity={0.7}>
            <Text style={sd.ghostText}>← Keep exploring</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const sd = StyleSheet.create({
  // Full-screen, centered (design: soul-overlay align/justify center, padding 28)
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Floating card — cream #FBF7EF, all corners 28, big soft shadow
  card: {
    width: '100%',
    backgroundColor: '#FBF7EF',
    borderRadius: 28,
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 24,
  },

  // Emoji tile — 128×128, radius 36, amber-pale gradient, glow shadow
  tileWrap: {
    marginBottom: 18,
    borderRadius: 36,
    shadowColor: '#D98C24',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 8,
  },
  tile: {
    width: 128,
    height: 128,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: { fontSize: 70 },

  // Kicker
  kicker: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#C99A4C',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Name — Lora serif (Georgia fallback)
  name: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Georgia',
    color: INK,
    marginTop: 4,
    textAlign: 'center',
  },

  // Description — §3 body text
  desc: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#6b6052',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },

  // Buttons — column, gap 10, margin-top 24
  btns: { alignSelf: 'stretch', marginTop: 24, gap: 10 },

  // CTA — amber ob-cta §5
  cta: {
    backgroundColor: AMBER,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#E29A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Ghost — white bg, brown text, hairline border (§5)
  ghost: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(139,94,60,0.18)',
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  ghostText: { fontSize: 15, fontWeight: '700', color: BROWN, letterSpacing: 0.1 },
});
