import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/googleAuth';
import { signInWithApple } from '../../lib/appleAuth';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';
const BROWN = '#8B5E3C';

const TOTAL_STEPS  = 9;
const CURRENT_STEP = 6; // segments 0–6 filled (screen 08)

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron({ color = INK }: { color?: string }) {
  return (
    <View style={su.chevronWrap}>
      <View style={[su.chevronArm1, { backgroundColor: color }]} />
      <View style={[su.chevronArm2, { backgroundColor: color }]} />
    </View>
  );
}

/** Apple logo — renders natively on iOS */
function AppleIcon() {
  return <Text style={su.appleGlyph}>{''}</Text>;
}

/** Google G — four-colour approximation using nested Text (iOS renders colour emoji fonts) */
function GoogleIcon() {
  return (
    <View style={su.googleG}>
      <Text style={su.googleGText}>G</Text>
    </View>
  );
}

/** "or" rule divider */
function OrDivider() {
  return (
    <View style={su.orRow}>
      <View style={su.orLine} />
      <Text style={su.orLabel}>or</Text>
      <View style={su.orLine} />
    </View>
  );
}

/** Mail envelope icon built from Views */
function MailIcon() {
  return (
    <View style={su.mailIcon}>
      {/* Envelope body */}
      <View style={su.mailBody}>
        {/* Flap V-shape using borders */}
        <View style={su.mailFlap} />
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

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
    setGoogleLoading(true);
    setError(null);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.ok) router.push('/onboarding/scan');
    else if (res.error) setError(res.error);
  };

  const onApple = async () => {
    setAppleLoading(true);
    setError(null);
    const res = await signInWithApple();
    setAppleLoading(false);
    if (res.ok) router.push('/onboarding/scan');
    else if (res.error) setError(res.error);
  };

  const createAccount = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      // Signed in instantly → root layout flushes the onboarding profile up.
      router.push('/onboarding/scan');
    } else {
      // Only happens if "Confirm email" is still on in Supabase.
      setError('Account created — turn off "Confirm email" in Supabase to sign in instantly.');
    }
  };

  return (
    <SafeAreaView style={su.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Topbar ───────────────────────────────────── */}
        <View style={su.topbar}>
          <TouchableOpacity style={su.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Chevron />
          </TouchableOpacity>
          <View style={su.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[su.seg, i <= CURRENT_STEP && su.segActive]} />
            ))}
          </View>
        </View>

        {/* ── Body ─────────────────────────────────────── */}
        <View style={su.body}>
          {/* Title — §3 Screen H1: 26px / 800 / Nunito / left-aligned */}
          <Text style={su.title}>Save your library.{'\n'}Take it anywhere.</Text>
          <Text style={su.sub}>
            Your whole collection, synced to your phone — so you always know what you own, even in the bookstore.
          </Text>

          {/* ── Email + password — §4 field (above the fold, clear of keyboard) ── */}
          <View style={su.field}>
            <MailIcon />
            <TextInput
              style={su.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={MUTE}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={su.field}>
            <TextInput
              style={su.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password (6+ characters)"
              placeholderTextColor={MUTE}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {!!error && <Text style={su.error}>{error}</Text>}

          <OrDivider />

          {/* ── Auth buttons ─────────────────────────── */}
          <View style={su.authStack}>
            {/* Apple — §5 dark button: #2A2420 bg, white text (iOS only) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={su.appleBtn} activeOpacity={0.85} onPress={onApple} disabled={appleLoading}>
                {appleLoading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <>
                    <AppleIcon />
                    <Text style={su.appleBtnText}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Google — §5 ghost variant: white bg, hairline border */}
            <TouchableOpacity style={su.googleBtn} activeOpacity={0.85} onPress={onGoogle} disabled={googleLoading}>
              {googleLoading ? (
                <ActivityIndicator color={INK} />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={su.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Footer ───────────────────────────────────── */}
        <View style={su.footer}>
          <TouchableOpacity
            style={[su.cta, disabled && su.ctaDisabled]}
            onPress={createAccount}
            disabled={disabled}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={[su.ctaText, disabled && su.ctaTextDisabled]}>Create account  →</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <Text style={su.legal}>
            By continuing you agree to our{' '}
            <Text style={su.legalLink}>Terms</Text>
            {' '}
            &{' '}
            <Text style={su.legalLink}>Privacy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const su = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg:         { flex: 1, height: 3.5, borderRadius: 999, backgroundColor: 'rgba(139,94,60,0.15)' },
  segActive:   { backgroundColor: AMBER },

  // ── Body
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 28, gap: 20 },

  // Title — §3 H1: 26px / 800 / Nunito / -0.4 tracking
  title: { fontSize: 26, fontWeight: '800', color: INK, letterSpacing: -0.4, lineHeight: 34 },
  sub:   { fontSize: 14.5, fontWeight: '500', color: MUTE, lineHeight: 22, marginTop: -6 },

  // ── Auth buttons
  authStack: { gap: 12 },

  // Apple button — §5 Secondary/dark: #2A2420 bg, white text, no border
  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2A2420', borderRadius: 16,
    paddingVertical: 17, gap: 10,
  },
  appleGlyph:    { color: WHITE, fontSize: 18, lineHeight: 22 },
  appleBtnText:  { color: WHITE, fontSize: 16, fontWeight: '700' },

  // Google button — §5 ghost variant: white bg, hairline border
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: WHITE, borderRadius: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.15)',
    paddingVertical: 17, gap: 10,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  googleG: {
    width: 22, height: 22, borderRadius: 2,
    backgroundColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
  },
  googleGText:   { color: WHITE, fontSize: 14, fontWeight: '800' },
  googleBtnText: { color: INK, fontSize: 16, fontWeight: '700' },

  // "or" divider
  orRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine:  { flex: 1, height: 0.5, backgroundColor: 'rgba(139,94,60,0.18)' },
  orLabel: { fontSize: 13, fontWeight: '600', color: MUTE },

  // ── Email field — §4 row: white surface, radius 16, hairline border
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WHITE, borderRadius: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    paddingHorizontal: 16, paddingVertical: 16,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  // Mail icon — built from Views
  mailIcon: { width: 18, height: 14, justifyContent: 'center' },
  mailBody: {
    width: 18, height: 13, borderRadius: 2,
    borderWidth: 1.5, borderColor: MUTE,
    overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center',
  },
  mailFlap: {
    width: 22, height: 9,
    borderBottomWidth: 8, borderBottomColor: 'transparent',
    borderLeftWidth: 11, borderLeftColor: 'transparent',
    borderRightWidth: 11, borderRightColor: 'transparent',
    borderTopWidth: 8, borderTopColor: MUTE,
    marginTop: -1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: INK, padding: 0 },
  codeInput: { fontSize: 22, fontWeight: '800', letterSpacing: 8, textAlign: 'center' },
  error: { fontSize: 13, fontWeight: '600', color: '#E0506B', marginTop: 4 },
  resend: { fontSize: 13.5, fontWeight: '700', color: BROWN, marginTop: 8 },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaDisabled:     { backgroundColor: '#EFE7D8', shadowOpacity: 0, elevation: 0 },
  ctaText:         { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  ctaTextDisabled: { color: '#C0B4A0' },

  // Legal text — §3 caption scale
  legal:     { textAlign: 'center', fontSize: 12.5, fontWeight: '500', color: MUTE },
  legalLink: { fontWeight: '800', color: BROWN },
});
