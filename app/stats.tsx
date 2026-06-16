import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PressableScale } from '../components/anim';
import { useSessionsStore } from '../store/sessionsStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { currentStreak, todayStats, weeklyMinutes, totals, fmtDuration } from '../lib/stats';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

// ── Reading life — the stats dashboard ─────────────────────────────────────
// Streak hero + today + this-week bars + all-time totals. Reached from Home
// (streak chip / stats row) and surfaces the payoff that keeps readers reading.
export default function StatsScreen() {
  const sessions = useSessionsStore((s) => s.sessions);
  const shelf = useBookshelfStore((s) => s.shelf);

  const streak = currentStreak(sessions);
  const today = todayStats(sessions);
  const week = weeklyMinutes(sessions);
  const tot = totals(sessions);
  const finished = Object.values(shelf).filter((e) => e.status === 'read').length;
  const maxMin = Math.max(1, ...week.map((d) => d.minutes));

  const streakSub =
    streak === 0
      ? 'Read today to start a streak'
      : today.seconds > 0
        ? 'You’ve read today — keep it going'
        : 'Read today to keep your streak alive';

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.topbar}>
        <PressableScale style={st.backBtn} onPress={() => router.back()}><Text style={st.backText}>✕</Text></PressableScale>
        <Text style={st.topTitle}>Reading life</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {/* ── Streak hero ─────────────────────────────── */}
        <View style={st.streakCard}>
          <Text style={st.flame}>🔥</Text>
          <Text style={st.streakNum}>{streak}</Text>
          <Text style={st.streakLabel}>day{streak === 1 ? '' : 's'} in a row</Text>
          <Text style={st.streakSub}>{streakSub}</Text>
        </View>

        {/* ── Today ───────────────────────────────────── */}
        <View style={st.row}>
          <View style={st.miniCard}><Text style={st.miniValue}>{fmtDuration(today.seconds)}</Text><Text style={st.miniLabel}>Read today</Text></View>
          <View style={st.miniCard}><Text style={st.miniValue}>{today.pages}</Text><Text style={st.miniLabel}>Pages today</Text></View>
        </View>

        {/* ── This week ───────────────────────────────── */}
        <Text style={st.section}>This week</Text>
        <View style={st.weekCard}>
          <View style={st.bars}>
            {week.map((d, i) => (
              <View key={i} style={st.barCol}>
                <View style={st.barTrack}>
                  <View style={[st.barFill, { height: `${Math.max(d.minutes === 0 ? 0 : 6, Math.round((d.minutes / maxMin) * 100))}%` }, d.isToday && st.barToday]} />
                </View>
                <Text style={[st.barLabel, d.isToday && st.barLabelToday]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── All time ────────────────────────────────── */}
        <Text style={st.section}>All time</Text>
        <View style={st.row}>
          <View style={st.miniCard}><Text style={st.miniValue}>{fmtDuration(tot.seconds)}</Text><Text style={st.miniLabel}>Total read</Text></View>
          <View style={st.miniCard}><Text style={st.miniValue}>{tot.pages}</Text><Text style={st.miniLabel}>Pages read</Text></View>
        </View>
        <View style={st.row}>
          <View style={st.miniCard}><Text style={st.miniValue}>{finished}</Text><Text style={st.miniLabel}>Books finished</Text></View>
          <View style={st.miniCard}><Text style={st.miniValue}>{tot.count}</Text><Text style={st.miniLabel}>Sessions</Text></View>
        </View>

        {sessions.length === 0 && (
          <Text style={st.empty}>Start a reading session from any book and your time, pages and streak will grow here.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink2 },
  topTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },

  content: { paddingHorizontal: 22, paddingBottom: 40 },

  // ── Streak hero
  streakCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 28, marginTop: 8, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  flame: { fontSize: 34 },
  streakNum: { fontFamily: fonts.light, fontSize: 64, letterSpacing: -2, color: colors.ink1, marginTop: 2 },
  streakLabel: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1, marginTop: -4 },
  streakSub: { fontFamily: fonts.serifItalic, ...ty.editorial, color: colors.ink3, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },

  // ── Mini cards
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  miniCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.card, paddingVertical: 18, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  miniValue: { fontFamily: fonts.semibold, ...ty.stat, color: colors.ink1 },
  miniLabel: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 4 },

  section: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1, marginTop: 28, marginBottom: 12 },

  // ── Week bars
  weekCard: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 },
  barCol: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { width: 22, height: 96, borderRadius: 999, backgroundColor: colors.chip, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 999, backgroundColor: colors.chipDeep },
  barToday: { backgroundColor: colors.accent },
  barLabel: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3 },
  barLabelToday: { fontFamily: fonts.semibold, color: colors.ink1 },

  empty: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, textAlign: 'center', marginTop: 26, paddingHorizontal: 16 },
});
