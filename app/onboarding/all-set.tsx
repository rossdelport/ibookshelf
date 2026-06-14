import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/userStore';
import { ANIMALS } from '../../constants/animals';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

// Final onboarding screen — no progress dots, no back. Celebrates and enters the app.
export default function AllSetScreen() {
  const { profile } = useUserStore();
  const soul = ANIMALS.find((a) => a.name === profile.soulAnimal) ?? ANIMALS.find((a) => a.name === 'Fox')!;
  const name = profile.username?.trim();

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(anim, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }).start();
  }, [anim]);

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  const enter = {
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Animated.View style={enter}>
          <LinearGradient colors={[colors.chip, colors.chipDeep]} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={s.tile}>
            <Text style={s.emoji}>{soul.emoji}</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[enter, s.copy]}>
          <Text style={s.h1}>You're all set{name ? `, ${name}` : ''}.</Text>
          <Text style={s.body}>Your shelves are ready. Time to get lost in a good book.</Text>
        </Animated.View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.cta} onPress={start} activeOpacity={0.9}>
          <Text style={s.ctaText}>Start reading</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  tile: { width: 122, height: 122, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', ...shadow.cardSoft },
  emoji: { fontSize: 66 },

  copy: { alignItems: 'center' },
  h1: { fontFamily: fonts.serifItalic, fontSize: 34, lineHeight: 40, color: colors.ink1, textAlign: 'center', marginTop: 30 },
  body: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, textAlign: 'center', marginTop: 12, maxWidth: 300 },

  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
