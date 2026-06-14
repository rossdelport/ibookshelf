import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

export default function WelcomeScreen() {
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) return <View style={styles.safe} />;
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconShadow}>
          <View style={styles.iconClip}>
            <Image source={require('../assets/images/logo-book.gif')} style={styles.iconGif} contentFit="cover" autoplay />
          </View>
        </View>

        <Text style={styles.title}>Fable</Text>
        <Text style={styles.subtitle}>Your home library, in your pocket</Text>
        <Text style={styles.tagline}>Catalogue every book you own, never buy a duplicate, and keep notes as you read.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/onboarding/unread'); }} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => router.push('/login')}>Log in</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconShadow: { width: 140, height: 140, borderRadius: 34, marginBottom: 32, ...shadow.card },
  iconClip: { width: 140, height: 140, borderRadius: 34, overflow: 'hidden', backgroundColor: colors.chip },
  iconGif: { width: '100%', height: '100%', transform: [{ scale: 1.05 }] },
  title: { fontSize: 46, fontFamily: fonts.light, color: colors.ink1, letterSpacing: -1, marginBottom: 10 },
  subtitle: { fontFamily: fonts.medium, ...ty.body, color: colors.ink2, marginBottom: 12 },
  tagline: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, textAlign: 'center', maxWidth: 320 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  button: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  buttonText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  loginText: { textAlign: 'center', fontFamily: fonts.regular, ...ty.body, color: colors.ink3, paddingBottom: 8 },
  loginLink: { color: colors.ink1, fontFamily: fonts.semibold },
});
