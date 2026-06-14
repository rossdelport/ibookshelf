import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ANIMALS } from '../../constants/animals';
import { useUserStore } from '../../store/userStore';
import { colors, fonts, radius, type as ty } from '../../constants/theme';

export default function SoulDetailScreen() {
  const { animal: animalName } = useLocalSearchParams<{ animal: string }>();
  const { setSoulAnimal } = useUserStore();

  const anim = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const animal = ANIMALS.find((a) => a.name === animalName);

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 440, easing: Easing.bezier(0.22, 1.4, 0.4, 1), useNativeDriver: true }).start();
  }, [anim]);

  if (!animal) {
    router.back();
    return null;
  }

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.bezier(0.4, 0, 0.7, 0.2), useNativeDriver: true }).start(() => router.back());
  }

  function confirm() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSoulAnimal(animal!.name);
    router.replace('/onboarding/shelf');
  }

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] });
  const cardOpacity = anim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 1, 1] });
  const scrimOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={sd.root}>
      {/* ── Charcoal scrim — tap outside to dismiss ─── */}
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: scrimOpacity }]}>
          <LinearGradient colors={['rgba(26,24,22,0.62)', 'rgba(18,16,15,0.9)']} start={{ x: 0.5, y: 0.15 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* ── Centered modal card ────────────────────────── */}
      <Animated.View style={[sd.card, { opacity: cardOpacity, transform: [{ scale }, { rotate }] }]}>
        <LinearGradient colors={[colors.chip, colors.chipDeep]} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={sd.tile}>
          <Text style={sd.tileEmoji}>{animal.emoji}</Text>
        </LinearGradient>

        <Text style={sd.kicker}>{animal.archetype}</Text>
        <Text style={sd.name}>{animal.name}</Text>
        <Text style={sd.desc}>{animal.description}</Text>

        <View style={sd.btns}>
          <TouchableOpacity style={sd.cta} onPress={confirm} activeOpacity={0.9}>
            <Text style={sd.ctaText}>This is me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sd.ghost} onPress={dismiss} activeOpacity={0.8}>
            <Text style={sd.ghostText}>Keep exploring</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const sd = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  card: {
    width: '100%', backgroundColor: colors.card, borderRadius: radius.sheet,
    paddingTop: 30, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.4, shadowRadius: 50, elevation: 24,
  },

  tile: { width: 122, height: 122, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  tileEmoji: { fontSize: 66 },

  kicker: { fontFamily: fonts.medium, ...ty.eyebrow, color: colors.ink3, textTransform: 'uppercase', textAlign: 'center' },
  name: { fontFamily: fonts.light, ...ty.title, color: colors.ink1, marginTop: 6, textAlign: 'center' },
  desc: { fontFamily: fonts.regular, ...ty.body, color: colors.ink2, textAlign: 'center', marginTop: 12 },

  btns: { alignSelf: 'stretch', marginTop: 24, gap: 10 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 17, alignItems: 'center' },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  ghost: { backgroundColor: colors.card, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, paddingVertical: 16, alignItems: 'center' },
  ghostText: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink2 },
});
