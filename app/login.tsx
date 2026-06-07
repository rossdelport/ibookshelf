import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

function Chevron() {
  return (
    <View style={lg.chevronWrap}>
      <View style={lg.chevronArm1} />
      <View style={lg.chevronArm2} />
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const onGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.ok) router.replace('/(tabs)');
    else if (res.error) setError(res.error);
  };

  const signIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Session is set → the root layout pulls this user's data; head to the app.
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={lg.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={lg.topbar}>
          <TouchableOpacity style={lg.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Chevron />
          </TouchableOpacity>
        </View>

        <View style={lg.body}>
          <Text style={lg.title}>Welcome back.</Text>
          <Text style={lg.sub}>Sign in to sync your library across your devices.</Text>

          {/* Google */}
          <TouchableOpacity style={lg.googleBtn} activeOpacity={0.85} onPress={onGoogle} disabled={googleLoading}>
            {googleLoading ? (
              <ActivityIndicator color={INK} />
            ) : (
              <>
                <View style={lg.googleG}><Text style={lg.googleGText}>G</Text></View>
                <Text style={lg.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={lg.orRow}>
            <View style={lg.orLine} />
            <Text style={lg.orLabel}>or</Text>
            <View style={lg.orLine} />
          </View>

          <View style={lg.field}>
            <TextInput
              style={lg.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={MUTE}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          <View style={lg.field}>
            <TextInput
              style={lg.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={MUTE}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!!error && <Text style={lg.error}>{error}</Text>}
        </View>

        <View style={lg.footer}>
          <TouchableOpacity
            style={[lg.cta, (loading || !valid) && lg.ctaDisabled]}
            onPress={signIn}
            disabled={loading || !valid}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={lg.ctaText}>Sign in  →</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const lg = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  body: { flex: 1, paddingHorizontal: 22, paddingTop: 28, gap: 14 },
  title: { fontSize: 28, fontWeight: '800', color: INK, letterSpacing: -0.5 },
  sub: { fontSize: 14.5, fontWeight: '500', color: MUTE, lineHeight: 21, marginBottom: 6 },

  field: {
    backgroundColor: WHITE, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    paddingHorizontal: 16, paddingVertical: 16,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  input: { fontSize: 15, fontWeight: '500', color: INK, padding: 0 },

  // Google button (§5 ghost variant)
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: WHITE, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.15)',
    paddingVertical: 17, marginTop: 4,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  googleG: { width: 22, height: 22, borderRadius: 2, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleGText: { color: WHITE, fontSize: 14, fontWeight: '800' },
  googleBtnText: { color: INK, fontSize: 16, fontWeight: '700' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(139,94,60,0.18)' },
  orLabel: { fontSize: 13, fontWeight: '600', color: MUTE },

  error: { fontSize: 13, fontWeight: '600', color: '#E0506B', marginTop: 2 },

  footer: { paddingHorizontal: 20, paddingBottom: 16 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaDisabled: { backgroundColor: '#EFE7D8', shadowOpacity: 0, elevation: 0 },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
