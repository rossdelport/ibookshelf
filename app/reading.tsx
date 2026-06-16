import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BookCover } from '../components/BookCover';
import { PressableScale } from '../components/anim';
import { useBookshelfStore } from '../store/bookshelfStore';
import { useSessionsStore } from '../store/sessionsStore';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

// Format elapsed seconds → M:SS or H:MM:SS.
function clock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ── Reading session — the focus screen ─────────────────────────────────────
// A distraction-free live timer (pause/resume). On Done it shows an editable
// summary (you can correct the minutes — deliberately unlike Bookly's locked
// auto-timer) and where you got to, then logs a session + updates the book.
export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBookshelfStore((s) => s.books[id]);
  const entry = useBookshelfStore((s) => s.shelf[id]);
  const updateShelfEntry = useBookshelfStore((s) => s.updateShelfEntry);
  const addSession = useSessionsStore((s) => s.addSession);

  const startPage = entry?.currentPage ?? 0;
  const total = book?.pageCount ?? 0;

  // Timestamp-based accumulation so the timer stays accurate across app
  // backgrounding (we measure real elapsed time, not interval ticks).
  const startedAtRef = useRef(new Date().toISOString());
  const accumulatedRef = useRef(0); // ms of counted reading time
  const runningSinceRef = useRef<number | null>(Date.now());
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const [phase, setPhase] = useState<'running' | 'summary'>('running');
  const [minutes, setMinutes] = useState(0);
  const [page, setPage] = useState(startPage);

  // 1s tick to advance the visible clock while running.
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(rerender, 1000);
    return () => clearInterval(t);
  }, [phase]);

  if (!book || !entry) {
    return (
      <View style={[r.safe, { paddingTop: insets.top }]}>
        <View style={r.center}>
          <Text style={r.missing}>This book isn’t on your shelf anymore.</Text>
          <PressableScale style={r.secondary} onPress={() => router.back()}><Text style={r.secondaryText}>Go back</Text></PressableScale>
        </View>
      </View>
    );
  }

  const running = runningSinceRef.current != null;
  const elapsedMs = accumulatedRef.current + (running ? Date.now() - (runningSinceRef.current ?? Date.now()) : 0);

  const togglePause = () => {
    Haptics.selectionAsync();
    if (running) {
      accumulatedRef.current += Date.now() - (runningSinceRef.current ?? Date.now());
      runningSinceRef.current = null;
    } else {
      runningSinceRef.current = Date.now();
    }
    rerender();
  };

  const finishTiming = () => {
    if (runningSinceRef.current != null) {
      accumulatedRef.current += Date.now() - runningSinceRef.current;
      runningSinceRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMinutes(Math.max(1, Math.round(accumulatedRef.current / 60000)));
    setPage(startPage);
    setPhase('summary');
  };

  const clampPage = (n: number) => Math.max(0, total ? Math.min(n, total) : n);

  const save = (markFinished: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSession({
      bookId: id,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      seconds: Math.max(0, Math.round(minutes * 60)),
      startPage,
      endPage: page,
    });
    const now = new Date().toISOString();
    updateShelfEntry(
      id,
      markFinished
        ? { status: 'read', currentPage: total || page, finishedAt: now, startedAt: entry.startedAt ?? startedAtRef.current }
        : { status: 'reading', currentPage: page, startedAt: entry.startedAt ?? startedAtRef.current },
    );
    router.back();
  };

  // ── Running ──────────────────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <View style={[r.safe, { paddingTop: insets.top }]}>
        <View style={r.topbar}>
          <PressableScale style={r.closeBtn} onPress={() => router.back()}><Text style={r.closeText}>✕</Text></PressableScale>
        </View>
        <View style={r.runBody}>
          <View style={r.coverWrap}><BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} /></View>
          <Text style={r.title} numberOfLines={2}>{book.title}</Text>
          <Text style={r.author} numberOfLines={1}>{book.author}</Text>
          <View style={r.timerBlock}>
            <Text style={r.clock}>{clock(elapsedMs / 1000)}</Text>
            <Text style={[r.status, !running && r.statusPaused]}>{running ? '● reading' : '❚❚ paused'}</Text>
          </View>
        </View>
        <View style={[r.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale style={r.secondary} onPress={togglePause}><Text style={r.secondaryText}>{running ? 'Pause' : 'Resume'}</Text></PressableScale>
          <PressableScale style={r.primary} onPress={finishTiming}><Text style={r.primaryText}>Done</Text></PressableScale>
        </View>
      </View>
    );
  }

  // ── Summary (editable) ─────────────────────────────────────────────────────
  const pct = total ? Math.round((page / total) * 100) : 0;
  return (
    <View style={[r.safe, { paddingTop: insets.top }]}>
      <View style={r.topbar}>
        <PressableScale style={r.closeBtn} onPress={() => router.back()}><Text style={r.closeText}>✕</Text></PressableScale>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* keyboardShouldPersistTaps="handled" lets a tap on empty space dismiss
            the number pad (which has no return key) and reveals the slider. */}
        <ScrollView contentContainerStyle={r.summary} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={r.eyebrow}>SESSION COMPLETE</Text>
          <Text style={r.summaryTitle} numberOfLines={1}>{book.title}</Text>

          <Text style={r.fieldLabel}>You read for</Text>
          <View style={r.inlineRow}>
            <TextInput
              style={r.minInput}
              value={String(minutes)}
              onChangeText={(t) => setMinutes(Math.max(0, Number(t.replace(/[^0-9]/g, '')) || 0))}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
            />
            <Text style={r.unit}>minutes</Text>
          </View>

          <Text style={[r.fieldLabel, { marginTop: 26 }]}>Where did you get to?</Text>
          <View style={r.inlineRow}>
            <Text style={r.unit}>page</Text>
            <TextInput
              style={r.pageInput}
              value={String(page)}
              onChangeText={(t) => setPage(clampPage(Number(t.replace(/[^0-9]/g, '')) || 0))}
              keyboardType="number-pad"
              maxLength={5}
              selectTextOnFocus
            />
            {total > 0 && <Text style={r.unit}>of {total}</Text>}
            {total > 0 && <Text style={r.pct}>{pct}%</Text>}
          </View>

          {total > 0 ? (
            <Slider
              style={r.slider}
              minimumValue={0}
              maximumValue={total}
              step={1}
              value={page}
              onValueChange={setPage}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.chipDeep}
              thumbTintColor={colors.accent}
            />
          ) : (
            <Text style={r.noTotal}>This book has no page count yet — type the page you reached.</Text>
          )}
        </ScrollView>
        <View style={[r.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale style={r.secondary} onPress={() => save(true)}><Text style={r.secondaryText}>Finished ✓</Text></PressableScale>
          <PressableScale style={r.primary} onPress={() => save(false)}><Text style={r.primaryText}>Save session</Text></PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const r = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8 },
  closeBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  missing: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3, textAlign: 'center', marginBottom: 18 },

  // ── Running: cover anchored at top, timer fills the space below it
  runBody: { flex: 1, alignItems: 'center', paddingTop: 8, paddingHorizontal: 30 },
  coverWrap: { width: 140, height: 210, marginBottom: 22 },
  title: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1, textAlign: 'center' },
  author: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.ink2, marginTop: 4 },
  timerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  clock: { fontFamily: fonts.light, fontSize: 68, letterSpacing: -1.5, color: colors.ink1, fontVariant: ['tabular-nums'] },
  status: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.success, marginTop: 6, letterSpacing: 0.4 },
  statusPaused: { color: colors.ink3 },

  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 22, paddingTop: 12 },
  secondary: { flex: 1, paddingVertical: 16, borderRadius: radius.button, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.semibold, ...ty.label, color: colors.ink1 },
  primary: { flex: 1, paddingVertical: 16, borderRadius: radius.button, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.button },
  primaryText: { fontFamily: fonts.semibold, ...ty.label, color: colors.accentText },

  // ── Summary
  summary: { paddingHorizontal: 30, paddingTop: 16, paddingBottom: 24 },
  eyebrow: { fontFamily: fonts.medium, ...ty.eyebrow, color: colors.ink3, textTransform: 'uppercase' },
  summaryTitle: { fontFamily: fonts.semibold, ...ty.titleSm, color: colors.ink1, marginTop: 8 },
  fieldLabel: { fontFamily: fonts.medium, ...ty.body, color: colors.ink2, marginTop: 28 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  minInput: { fontFamily: fonts.semibold, fontSize: 40, letterSpacing: -1, color: colors.ink1, minWidth: 96, textAlign: 'center', backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingVertical: 8, paddingHorizontal: 14 },
  pageInput: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink1, minWidth: 64, textAlign: 'center', backgroundColor: colors.card, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.line, paddingVertical: 6, paddingHorizontal: 10 },
  unit: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3 },
  pct: { marginLeft: 'auto', fontFamily: fonts.semibold, ...ty.stat, color: colors.ink1 },
  slider: { width: '100%', height: 40, marginTop: 18 },
  noTotal: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, marginTop: 16 },
});
