import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureError } from '../lib/sentry';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

// Friendly fallback shown by the root error boundary when a screen throws,
// instead of a white screen. Reports the error so we hear about it.
export function ErrorScreen({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    captureError(error, { boundary: 'root' });
  }, [error]);

  return (
    <View style={es.fill}>
      <Text style={es.emoji}>📚</Text>
      <Text style={es.title}>Something went wrong</Text>
      <Text style={es.body}>
        The app hit an unexpected error. Your library is safe and backed up — try again.
      </Text>
      {__DEV__ && !!error?.message && <Text style={es.detail}>{error.message}</Text>}
      <TouchableOpacity style={es.cta} onPress={retry} activeOpacity={0.85}>
        <Text style={es.ctaText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const es = StyleSheet.create({
  fill: { flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emoji: { fontSize: 52, marginBottom: 18 },
  title: { fontFamily: 'Georgia', fontSize: 24, fontWeight: '600', color: INK, textAlign: 'center' },
  body: { fontSize: 14.5, fontWeight: '500', color: MUTE, textAlign: 'center', lineHeight: 22, marginTop: 12 },
  detail: { fontSize: 12, fontWeight: '600', color: '#B5654A', textAlign: 'center', marginTop: 14 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 30, marginTop: 28,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
