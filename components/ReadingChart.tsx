import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Line as SvgLine, Circle, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { PressableScale } from './anim';
import { useSessionsStore } from '../store/sessionsStore';
import { chartSeries, estimatedWpm, readingSpeedStanding, fmtDuration, type ChartRange } from '../lib/stats';
import { colors, fonts, type as ty } from '../constants/theme';

// ── Detailed reading chart (Profile) ───────────────────────────────────────
// A top-level line graph of minutes read (Y) per day (X), Week / Month / Year,
// plus an estimated words-per-minute with a real percentile against adult
// reading-speed research.
const RANGES: { key: ChartRange; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];
const RANGE_NOUN: Record<ChartRange, string> = { week: 'this week', month: 'last 30 days', year: 'this year' };

const H = 162;
const PAD = { left: 30, right: 10, top: 12, bottom: 22 };

// Round the Y axis up to a clean ceiling so gridlines read nicely.
function niceMax(m: number): number {
  if (m <= 10) return 10;
  if (m <= 20) return 20;
  if (m <= 30) return 30;
  if (m <= 60) return Math.ceil(m / 15) * 15;
  if (m <= 120) return Math.ceil(m / 30) * 30;
  return Math.ceil(m / 60) * 60;
}

export function ReadingChart() {
  const sessions = useSessionsStore((s) => s.sessions);
  const [range, setRange] = useState<ChartRange>('week');
  const [w, setW] = useState(0);

  const { bars, totalSeconds } = useMemo(() => chartSeries(sessions, range), [sessions, range]);
  const wpm = useMemo(() => estimatedWpm(sessions), [sessions]);
  const standing = wpm != null ? readingSpeedStanding(wpm) : null;

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View>
      {/* ── Range toggle ─────────────────────────────── */}
      <View style={c.toggle}>
        {RANGES.map((rg) => {
          const active = range === rg.key;
          return (
            <PressableScale key={rg.key} style={[c.seg, active && c.segActive]} scaleTo={0.97} onPress={() => { Haptics.selectionAsync(); setRange(rg.key); }}>
              <Text style={[c.segText, active && c.segTextActive]}>{rg.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      {/* ── Range total ──────────────────────────────── */}
      <Text style={c.total}>
        <Text style={c.totalStrong}>{fmtDuration(totalSeconds)}</Text> read {RANGE_NOUN[range]}
      </Text>

      {/* ── Line graph ───────────────────────────────── */}
      <View style={{ height: H }} onLayout={onLayout}>
        {w > 0 && <LineGraph width={w} bars={bars} showDots={range !== 'month'} />}
      </View>

      {/* ── Words per minute ─────────────────────────── */}
      <View style={c.wpmRow}>
        {wpm != null && standing ? (
          <>
            <View style={c.wpmLeft}>
              <Text style={c.wpmValue}>≈ {wpm}</Text>
              <Text style={c.wpmUnit}>words / min</Text>
            </View>
            <View style={c.wpmRight}>
              {standing.topPercent <= 10 ? (
                <View style={c.badge}><Text style={c.badgeText}>🏆  Top {standing.topPercent}% of readers</Text></View>
              ) : standing.fasterThanPercent >= 50 ? (
                <View style={c.badgeSoft}><Text style={c.badgeSoftText}>Faster than {standing.fasterThanPercent}% of readers</Text></View>
              ) : (
                <View style={c.badgeSoft}><Text style={c.badgeSoftText}>Building your reading pace</Text></View>
              )}
              <Text style={c.wpmFoot}>Estimated from pages, vs. average adult speed</Text>
            </View>
          </>
        ) : (
          <Text style={c.wpmEmpty}>Read a little more with the timer to unlock your words-per-minute.</Text>
        )}
      </View>
    </View>
  );
}

function LineGraph({ width, bars, showDots }: { width: number; bars: { label: string; minutes: number; current: boolean }[]; showDots: boolean }) {
  const px0 = PAD.left;
  const px1 = width - PAD.right;
  const py0 = PAD.top;
  const py1 = H - PAD.bottom;
  const n = bars.length;
  const maxMin = Math.max(...bars.map((b) => b.minutes), 0);
  const yMax = niceMax(maxMin);

  const xAt = (i: number) => (n <= 1 ? (px0 + px1) / 2 : px0 + (i / (n - 1)) * (px1 - px0));
  const yAt = (m: number) => py1 - (m / yMax) * (py1 - py0);

  const pts = bars.map((b, i) => ({ x: xAt(i), y: yAt(b.minutes), ...b }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `M ${pts[0].x.toFixed(1)} ${py1} ` + pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ` L ${pts[n - 1].x.toFixed(1)} ${py1} Z`;

  const ticks = [0, Math.round(yMax / 2), yMax];

  return (
    <Svg width={width} height={H}>
      {/* gridlines + Y labels (minutes) */}
      {ticks.map((t, i) => {
        const y = yAt(t);
        return [
          <SvgLine key={`l${i}`} x1={px0} y1={y} x2={px1} y2={y} stroke={colors.line} strokeWidth={1} />,
          <SvgText key={`t${i}`} x={px0 - 6} y={y + 3} fontSize={9} fontFamily={fonts.medium} fill={colors.ink3} textAnchor="end">{t > 0 ? `${t}m` : '0'}</SvgText>,
        ];
      })}

      {/* area + line */}
      <Path d={areaPath} fill={colors.accent} fillOpacity={0.08} />
      <Path d={linePath} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* dots */}
      {pts.map((p, i) =>
        p.current ? (
          <Circle key={`c${i}`} cx={p.x} cy={p.y} r={4.5} fill={colors.accent} stroke={colors.card} strokeWidth={2} />
        ) : showDots ? (
          <Circle key={`c${i}`} cx={p.x} cy={p.y} r={2.6} fill={colors.accent} />
        ) : null,
      )}

      {/* X labels (days) */}
      {pts.map((p, i) => (p.label ? <SvgText key={`x${i}`} x={p.x} y={H - 5} fontSize={9.5} fontFamily={fonts.medium} fill={colors.ink3} textAnchor="middle">{p.label}</SvgText> : null))}
    </Svg>
  );
}

const c = StyleSheet.create({
  toggle: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: 999, padding: 3, gap: 2, marginBottom: 16 },
  seg: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  segActive: { backgroundColor: colors.accent },
  segText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },
  segTextActive: { color: colors.accentText },

  total: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, marginBottom: 8 },
  totalStrong: { fontFamily: fonts.semibold, color: colors.ink1 },

  wpmRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  wpmLeft: { alignItems: 'flex-start' },
  wpmValue: { fontFamily: fonts.light, fontSize: 38, letterSpacing: -1, color: colors.ink1 },
  wpmUnit: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: -2 },
  wpmRight: { flex: 1, alignItems: 'flex-end', gap: 6 },
  badge: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  badgeText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.accentText },
  badgeSoft: { backgroundColor: colors.successSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  badgeSoftText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.success },
  wpmFoot: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.ink3, textAlign: 'right' },
  wpmEmpty: { flex: 1, fontFamily: fonts.regular, ...ty.body, color: colors.ink3 },
});
