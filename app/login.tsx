import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { signInWithApple } from '../lib/appleAuth';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

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
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const onGoogle = async () => {
    setGoogleLoading(true); setError(null);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.ok) router.replace('/(tabs)'); else if (res.error) setError(res.error);
  };

  const onApple = async () => {
    setAppleLoading(true); setError(null);
    const res = await signInWithApple();
    setAppleLoading(false);
    if (res.ok) router.replace('/(tabs)'); else if (res.error) setError(res.error);
  };

  const signIn = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={lg.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={lg.topbar}>
          <TouchableOpacity style={lg.backBtn} onPress={() => router.back()} activeOpacity={0.7}><Chevron /></TouchableOpacity>
        </View>

        <View style={lg.body}>
          <Text style={lg.title}>Welcome back.</Text>
          <Text style={lg.sub}>Sign in to sync your library across your devices.</Text>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={lg.appleBtn} activeOpacity={0.85} onPress={onApple} disabled={appleLoading}>
              {appleLoading ? <ActivityIndicator color={colors.accentText} /> : (<><Text style={lg.appleGlyph}></Text><Text style={lg.appleBtnText}>Continue with Apple</Text></>)}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={lg.googleBtn} activeOpacity={0.85} onPress={onGoogle} disabled={googleLoading}>
            {googleLoading ? <ActivityIndicator color={colors.ink1} /> : (<><View style={lg.googleG}><Text style={lg.googleGText}>G</Text></View><Text style={lg.googleBtnText}>Continue with Google</Text></>)}
          </TouchableOpacity>

          <View style={lg.orRow}>
            <View style={lg.orLine} />
            <Text style={lg.orLabel}>or</Text>
            <View style={lg.orLine} />
          </View>

          <View style={lg.field}>
            <TextInput style={lg.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={colors.ink3} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus />
          </View>
          <View style={lg.field}>
            <TextInput style={lg.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.ink3} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          </View>

          {!!error && <Text style={lg.error}>{error}</Text>}
        </View>

        <View style={lg.footer}>
          <TouchableOpacity style={[lg.cta, (loading || !valid) && lg.ctaDisabled]} onPress={signIn} disabled={loading || !valid} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[lg.ctaText, (loading || !valid) && lg.ctaTextDisabled]}>Sign in</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const lg = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  body: { flex: 1, paddingHorizontal: 22, paddingTop: 28, gap: 14 },
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginBottom: 6 },

  field: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 16, ...shadow.cardSoft },
  input: { fontFamily: fonts.regular, fontSize: 15.5, color: colors.ink1, padding: 0 },

  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 16, marginTop: 4 },
  appleGlyph: { color: colors.accentText, fontSize: 18, marginTop: -2 },
  appleBtnText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, paddingVertical: 16, marginTop: 4, ...shadow.cardSoft },
  googleG: { width: 22, height: 22, borderRadius: 2, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleGText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 14 },
  googleBtnText: { color: colors.ink1, fontFamily: fonts.semibold, ...ty.label },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  orLabel: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3 },

  error: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.danger, marginTop: 2 },

  footer: { paddingHorizontal: 22, paddingBottom: 16 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaDisabled: { backgroundColor: colors.chip, shadowOpacity: 0, elevation: 0 },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  ctaTextDisabled: { color: colors.ink3 },
});
