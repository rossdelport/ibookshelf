import type { ReadingSession } from '../store/sessionsStore';

// Pure derivations over reading sessions — streaks, daily/weekly/all-time
// totals. All day bucketing is in the device's local timezone so "today" and
// streaks line up with the reader's calendar.

export function sessionPages(s: ReadingSession): number {
  if (s.startPage == null || s.endPage == null) return 0;
  return Math.max(0, s.endPage - s.startPage);
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysWithReading(sessions: ReadingSession[]): Set<string> {
  const set = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.endedAt);
    if (!isNaN(d.getTime())) set.add(dayKey(d));
  }
  return set;
}

// Consecutive local days of reading ending today — or yesterday if nothing has
// been logged yet today, so a streak stays alive through the day you can still
// extend it (read today → it keeps counting).
export function currentStreak(sessions: ReadingSession[]): number {
  const set = daysWithReading(sessions);
  if (set.size === 0) return 0;
  const cursor = new Date();
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function todayStats(sessions: ReadingSession[]): { seconds: number; pages: number } {
  const today = dayKey(new Date());
  let seconds = 0;
  let pages = 0;
  for (const s of sessions) {
    const d = new Date(s.endedAt);
    if (!isNaN(d.getTime()) && dayKey(d) === today) {
      seconds += s.seconds;
      pages += sessionPages(s);
    }
  }
  return { seconds, pages };
}

export interface DayBar { label: string; minutes: number; isToday: boolean }

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Minutes read per day for the last 7 days (oldest → today).
export function weeklyMinutes(sessions: ReadingSession[]): DayBar[] {
  const byDay: Record<string, number> = {};
  for (const s of sessions) {
    const d = new Date(s.endedAt);
    if (isNaN(d.getTime())) continue;
    const k = dayKey(d);
    byDay[k] = (byDay[k] ?? 0) + s.seconds;
  }
  const todayKey = dayKey(new Date());
  const out: DayBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({ label: DOW[d.getDay()], minutes: Math.round((byDay[k] ?? 0) / 60), isToday: k === todayKey });
  }
  return out;
}

export function totals(sessions: ReadingSession[]): { seconds: number; pages: number; count: number } {
  let seconds = 0;
  let pages = 0;
  for (const s of sessions) {
    seconds += s.seconds;
    pages += sessionPages(s);
  }
  return { seconds, pages, count: sessions.length };
}

export function bookSeconds(sessions: ReadingSession[], bookId: string): number {
  return sessions.filter((s) => s.bookId === bookId).reduce((a, s) => a + s.seconds, 0);
}

// "3h 20m" / "45m" / "0m"
export function fmtDuration(seconds: number): string {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Detailed reading chart ─────────────────────────────────────────────────
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export type ChartRange = 'week' | 'month' | 'year';
export interface ChartBar { label: string; minutes: number; current: boolean }

// Minutes-read bars for the selected range: 7 daily / 30 daily / 12 monthly.
export function chartSeries(sessions: ReadingSession[], range: ChartRange): { bars: ChartBar[]; totalSeconds: number } {
  const bars: ChartBar[] = [];
  let totalSeconds = 0;

  if (range === 'year') {
    const byMonth: Record<string, number> = {};
    for (const s of sessions) {
      const d = new Date(s.endedAt);
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth[k] = (byMonth[k] ?? 0) + s.seconds;
    }
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const secs = byMonth[`${d.getFullYear()}-${d.getMonth()}`] ?? 0;
      totalSeconds += secs;
      bars.push({ label: MONTHS[d.getMonth()], minutes: Math.round(secs / 60), current: i === 0 });
    }
    return { bars, totalSeconds };
  }

  const days = range === 'week' ? 7 : 30;
  const byDay: Record<string, number> = {};
  for (const s of sessions) {
    const d = new Date(s.endedAt);
    if (isNaN(d.getTime())) continue;
    byDay[dayKey(d)] = (byDay[dayKey(d)] ?? 0) + s.seconds;
  }
  const todayKey = dayKey(new Date());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const secs = byDay[k] ?? 0;
    totalSeconds += secs;
    // Week: label every day. Month: a sparse date tick every 5th bar.
    const label = range === 'week' ? DOW[d.getDay()] : i % 5 === 0 ? String(d.getDate()) : '';
    bars.push({ label, minutes: Math.round(secs / 60), current: k === todayKey });
  }
  return { bars, totalSeconds };
}

// ── Words per minute + honest percentile ───────────────────────────────────
// Words are estimated from pages (no reliable per-book word counts exist).
// ~250 words/page is the standard publishing estimate for a typical novel.
const WORDS_PER_PAGE = 250;

// Only sessions with BOTH real page progress and time feed the WPM estimate.
export function estimatedWpm(sessions: ReadingSession[]): number | null {
  let secs = 0;
  let pages = 0;
  for (const s of sessions) {
    const p = sessionPages(s);
    if (p > 0 && s.seconds > 0) {
      secs += s.seconds;
      pages += p;
    }
  }
  const minutes = secs / 60;
  // Need enough signal to be meaningful, and reject implausible outliers.
  if (minutes < 15 || pages < 10) return null;
  const wpm = (pages * WORDS_PER_PAGE) / minutes;
  if (wpm < 30 || wpm > 2000) return null;
  return Math.round(wpm);
}

// Percentile against published adult reading-speed research: Brysbaert (2019)
// meta-analysis of 190 studies → mean silent reading ≈ 238 wpm. We model the
// spread as roughly normal (σ≈55) and report the reader's real standing.
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

export function readingSpeedStanding(wpm: number): { topPercent: number; fasterThanPercent: number } {
  const MU = 238;
  const SIGMA = 55;
  const below = 0.5 * (1 + erf((wpm - MU) / SIGMA / Math.SQRT2)); // share of readers slower
  return {
    fasterThanPercent: Math.min(99, Math.max(1, Math.round(below * 100))),
    topPercent: Math.min(99, Math.max(1, Math.round((1 - below) * 100))),
  };
}
