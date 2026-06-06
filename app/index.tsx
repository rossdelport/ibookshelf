import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const AMBER = '#C8852A';
const BG = '#F2E8D8';
const DARK = '#2C1A0E';
const MUTED = '#8B7A68';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconShadow}>
          {/* Rounded clip + slight scale crops the gif's black corners */}
          <View style={styles.iconClip}>
            <Image
              source={require('../assets/images/logo-book.gif')}
              style={styles.iconGif}
              contentFit="cover"
              autoplay
            />
          </View>
        </View>

        <Text style={styles.title}>iBookshelf</Text>
        <Text style={styles.subtitle}>Your cosy reading companion</Text>
        <Text style={styles.tagline}>
          Track every book, keep your streak{'\n'}alive, and find your reading kin.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/onboarding/unread')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started  →</Text>
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => router.replace('/(tabs)')}>
            Log in
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconShadow: {
    width: 140,
    height: 140,
    borderRadius: 34,
    marginBottom: 32,
    shadowColor: '#5A3A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconClip: {
    width: 140,
    height: 140,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#F6EFE2',
  },
  iconGif: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.05 }],
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: DARK,
    fontFamily: 'Georgia',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: AMBER,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  tagline: {
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 23,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  button: {
    backgroundColor: AMBER,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  loginText: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 14,
    paddingBottom: 8,
  },
  loginLink: {
    color: DARK,
    fontWeight: '700',
  },
});
