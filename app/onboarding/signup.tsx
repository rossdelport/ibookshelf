import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/googleAuth';
import { signInWithApple } from '../../lib/appleAuth';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 6;

function Chevron() {
  return (
    <View style={su.chevronWrap}>
      <View style={su.chevronArm1} />
      <View style={su.chevronArm2} />
    </View>
  );
}

function AppleIcon() {
  return <Text style={su.appleGlyph}>{''}</Text>;
}

function GoogleIcon() {
  return <View style={su.googleG}><Text style={su.googleGText}>G</Text></View>;
}

function OrDivider() {
  return (
    <View style={su.orRow}>
      <View style={su.orLine} />
      <Text style={su.orLabel}>or</Text>
      <View style={su.orLine} />
    </View>
  );
}

function MailIcon() {
  return (
    <View style={su.mailIcon}>
      <View style={su.mailBody}><View style={su.mailFlap} /></View>
    </View>
  );
}

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = email.includes('@') && email.includes('.');
  const passwordValid = password.length >= 6;
  const disabled = loading || googleLoading || appleLoading || !emailValid || !passwordValid;

  const onGoogle = async () => {
    setGoogleLoading(true); setError(null);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.ok) router.push('/onboarding/scan'); else if (res.error) setError(res.error);
  };

  const onApple = async () => {
    setAppleLoading(true); setError(null);
    const res = await signInWithApple();
    setAppleLoading(false);
    if (res.ok) router.push('/onboarding/scan'); else if (res.error) setError(res.error);
  };

  const createAccount = async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) router.push('/onboarding/scan');
    else setError('Account created — turn off "Confirm email" in Supabase to sign in instantly.');
  };

  return (
    <SafeAreaView style={su.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={su.topbar}>
          <TouchableOpacity style={su.backBtn} onPress={() => router.back()} activeOpacity={0.7}><Chevron /></TouchableOpacity>
          <View style={su.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[su.seg, i <= CURRENT_STEP && su.segActive]} />
            ))}
          </View>
        </View>

        <View style={su.body}>
          <Text style={su.title}>Save your library. Take it anywhere.</Text>
          <Text style={su.sub}>Your whole collection, synced to your phone — so you always know what you own, even in the bookstore.</Text>

          <View style={su.field}>
            <MailIcon />
            <TextInput style={su.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={colors.ink3} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={su.field}>
            <TextInput style={su.input} value={password} onChangeText={setPassword} placeholder="Password (6+ characters)" placeholderTextColor={colors.ink3} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          </View>

          {!!error && <Text style={su.error}>{error}</Text>}

          <OrDivider />

          <View style={su.authStack}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={su.appleBtn} activeOpacity={0.85} onPress={onApple} disabled={appleLoading}>
                {appleLoading ? <ActivityIndicator color={colors.accentText} /> : (<><AppleIcon /><Text style={su.appleBtnText}>Continue with Apple</Text></>)}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={su.googleBtn} activeOpacity={0.85} onPress={onGoogle} disabled={googleLoading}>
              {googleLoading ? <ActivityIndicator color={colors.ink1} /> : (<><GoogleIcon /><Text style={su.googleBtnText}>Continue with Google</Text></>)}
            </TouchableOpacity>
          </View>
        </View>

        <View style={su.footer}>
          <TouchableOpacity style={[su.cta, disabled && su.ctaDisabled]} onPress={createAccount} disabled={disabled} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[su.ctaText, disabled && su.ctaTextDisabled]}>Create account</Text>}
          </TouchableOpacity>
          <Text style={su.legal}>
            By continuing you agree to our <Text style={su.legalLink}>Terms</Text> & <Text style={su.legalLink}>Privacy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const su = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  segActive: { backgroundColor: colors.accent },

  body: { flex: 1, paddingHorizontal: 22, paddingTop: 28, gap: 18 },
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginTop: -4 },

  authStack: { gap: 12 },
  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 16, gap: 10 },
  appleGlyph: { color: colors.accentText, fontSize: 18, lineHeight: 22 },
  appleBtnText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, paddingVertical: 16, gap: 10, ...shadow.cardSoft },
  googleG: { width: 22, height: 22, borderRadius: 2, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleGText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 14 },
  googleBtnText: { color: colors.ink1, fontFamily: fonts.semibold, ...ty.label },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  orLabel: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3 },

  field: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 16, ...shadow.cardSoft },
  mailIcon: { width: 18, height: 14, justifyContent: 'center' },
  mailBody: { width: 18, height: 13, borderRadius: 2, borderWidth: 1.5, borderColor: colors.ink3, overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center' },
  mailFlap: { width: 22, height: 9, borderBottomWidth: 8, borderBottomColor: 'transparent', borderLeftWidth: 11, borderLeftColor: 'transparent', borderRightWidth: 11, borderRightColor: 'transparent', borderTopWidth: 8, borderTopColor: colors.ink3, marginTop: -1 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: colors.ink1, padding: 0 },
  error: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.danger, marginTop: 4 },

  footer: { paddingHorizontal: 22, paddingBottom: 16, gap: 12 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaDisabled: { backgroundColor: colors.chip, shadowOpacity: 0, elevation: 0 },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  ctaTextDisabled: { color: colors.ink3 },
  legal: { textAlign: 'center', fontFamily: fonts.regular, ...ty.caption, color: colors.ink3 },
  legalLink: { fontFamily: fonts.semibold, color: colors.ink2 },
});
