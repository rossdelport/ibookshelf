import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BookCover } from '../../components/BookCover';
import { ProgressSheet } from '../../components/ProgressSheet';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import { shelfChipColor } from '../../constants/shelfColors';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';
import type { ReadingStatus } from '../../types/book';

const STATUSES: { key: ReadingStatus; label: string; emoji: string }[] = [
  { key: 'want_to_read', label: 'To read', emoji: '📋' },
  { key: 'reading', label: 'Reading', emoji: '📖' },
  { key: 'read', label: 'Finished', emoji: '✅' },
  { key: 'did_not_finish', label: 'DNF', emoji: '🌙' },
];

function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function Chevron() {
  return (
    <View style={d.chevronWrap}>
      <View style={d.chevronArm1} />
      <View style={d.chevronArm2} />
    </View>
  );
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBookshelfStore((s) => s.books[id]);
  const entry = useBookshelfStore((s) => s.shelf[id]);
  const updateShelfEntry = useBookshelfStore((s) => s.updateShelfEntry);
  const removeFromShelf = useBookshelfStore((s) => s.removeFromShelf);
  const toggleBookShelf = useBookshelfStore((s) => s.toggleBookShelf);
  const updateBook = useBookshelfStore((s) => s.updateBook);
  const shelfDefs = useUserStore((s) => s.profile.shelves);

  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [editing, setEditing] = useState(false);
  const [titleStr, setTitleStr] = useState(book?.title ?? '');
  const [authorStr, setAuthorStr] = useState(book?.author ?? '');
  const [descExpanded, setDescExpanded] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  if (!book || !entry) {
    return (
      <SafeAreaView style={d.safe}>
        <View style={d.topbar}>
          <TouchableOpacity style={d.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back"><Chevron /></TouchableOpacity>
        </View>
        <View style={d.missing}><Text style={d.missingText}>This book isn't on your shelf anymore.</Text></View>
      </SafeAreaView>
    );
  }

  const setStatus = (status: ReadingStatus) => {
    Haptics.selectionAsync();
    const now = new Date().toISOString();
    const updates: Parameters<typeof updateShelfEntry>[1] = { status };
    if (status === 'reading' && !entry.startedAt) updates.startedAt = now;
    if (status === 'read') {
      updates.finishedAt = now;
      if (book.pageCount) updates.currentPage = book.pageCount;
    }
    updateShelfEntry(id, updates);
  };

  const onNotesChange = (t: string) => { setNotes(t); updateShelfEntry(id, { notes: t }); };

  const remove = () =>
    Alert.alert('Remove from library?', `“${book.title}” and its notes, rating and progress will be removed. This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removeFromShelf(id); router.back(); } },
    ]);

  const setRating = (r: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateShelfEntry(id, { rating: entry.rating === r ? undefined : r });
  };

  const startEdit = () => { setTitleStr(book.title); setAuthorStr(book.author); setEditing(true); };
  const saveEdit = () => {
    const t = titleStr.trim();
    if (!t) return;
    updateBook(id, { title: t, author: authorStr.trim() || 'Unknown author' });
    setEditing(false);
  };

  const pct = book.pageCount ? Math.min((entry.currentPage ?? 0) / book.pageCount, 1) : 0;
  const meta = [book.publishedYear, book.pageCount ? `${book.pageCount} pp` : null, book.genres?.[0]].filter(Boolean).join(' · ');
  const dates = [`Added ${fmtDate(entry.addedAt)}`, entry.startedAt ? `Started ${fmtDate(entry.startedAt)}` : null, entry.finishedAt ? `Finished ${fmtDate(entry.finishedAt)}` : null].filter(Boolean).join('   ·   ');

  return (
    <SafeAreaView style={d.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={d.topbar}>
          <TouchableOpacity style={d.backBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back"><Chevron /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={d.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Hero ───────────────────────────────────── */}
          <View style={d.hero}>
            <TouchableOpacity style={d.coverWrap} activeOpacity={0.85} onPress={() => router.push({ pathname: '/change-cover', params: { id } })}>
              <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} pct={entry.status === 'reading' ? pct : undefined} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/change-cover', params: { id } })} activeOpacity={0.7}>
              <Text style={d.link}>Change cover</Text>
            </TouchableOpacity>

            {editing ? (
              <View style={d.editBox}>
                <TextInput style={d.editTitle} value={titleStr} onChangeText={setTitleStr} placeholder="Title" placeholderTextColor={colors.ink3} multiline />
                <TextInput style={d.editAuthor} value={authorStr} onChangeText={setAuthorStr} placeholder="Author" placeholderTextColor={colors.ink3} />
                <View style={d.editActions}>
                  <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.7}><Text style={d.editCancel}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={saveEdit} activeOpacity={0.7}><Text style={d.editSave}>Save</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={d.title}>{book.title}</Text>
                <Text style={d.author}>{book.author}</Text>
                {!!meta && <Text style={d.meta}>{meta}</Text>}
                <TouchableOpacity onPress={startEdit} activeOpacity={0.7}><Text style={d.link}>Edit details</Text></TouchableOpacity>
              </>
            )}
          </View>

          {/* ── About ──────────────────────────────────── */}
          {!!book.description && (
            <>
              <Text style={d.sectionLabel}>ABOUT</Text>
              <Text style={d.about} numberOfLines={descExpanded ? undefined : 5}>{book.description}</Text>
              {book.description.length > 180 && (
                <TouchableOpacity onPress={() => setDescExpanded((e) => !e)} activeOpacity={0.7}><Text style={d.link}>{descExpanded ? 'Show less' : 'Read more'}</Text></TouchableOpacity>
              )}
            </>
          )}

          {/* ── Status ─────────────────────────────────── */}
          <Text style={d.sectionLabel}>STATUS</Text>
          <View style={d.chipRow}>
            {STATUSES.map((s) => {
              const active = entry.status === s.key;
              return (
                <TouchableOpacity key={s.key} style={[d.chip, active && d.chipActive]} onPress={() => setStatus(s.key)} activeOpacity={0.8}>
                  <Text style={d.chipEmoji}>{s.emoji}</Text>
                  <Text style={[d.chipText, active && d.chipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Reading progress (tap to update) ───────── */}
          {entry.status === 'reading' && (
            <>
              <Text style={d.sectionLabel}>PROGRESS</Text>
              <TouchableOpacity style={d.progressCard} activeOpacity={0.85} onPress={() => setShowProgress(true)}>
                <View style={d.progRow}>
                  <Text style={d.progLabel}>{book.pageCount ? `Page ${entry.currentPage ?? 0} of ${book.pageCount}` : `Page ${entry.currentPage ?? 0}`}</Text>
                  <Text style={d.progPct}>{Math.round(pct * 100)}%</Text>
                </View>
                <View style={d.progBar}><View style={[d.progFill, { width: `${Math.round(pct * 100)}%` }]} /></View>
                <Text style={d.progHint}>Tap to update progress</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Shelves ────────────────────────────────── */}
          <Text style={d.sectionLabel}>SHELVES</Text>
          <View style={d.chipRow}>
            {(shelfDefs ?? []).map((sh) => {
              const on = (entry.shelves ?? []).includes(sh.name);
              const tint = shelfChipColor(sh.color);
              return (
                <TouchableOpacity key={sh.name} style={[d.chip, on && d.chipActive, on ? { backgroundColor: tint, borderColor: tint } : null]} onPress={() => toggleBookShelf(id, sh.name)} activeOpacity={0.8}>
                  <Text style={d.chipEmoji}>{sh.emoji}</Text>
                  <Text style={[d.chipText, on && d.chipTextActive]}>{sh.name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={d.newShelfChip} onPress={() => router.push({ pathname: '/new-shelf', params: { addBook: id } })} activeOpacity={0.8}>
              <Text style={d.newShelfText}>＋ New shelf</Text>
            </TouchableOpacity>
          </View>

          {/* ── Rating ─────────────────────────────────── */}
          <Text style={d.sectionLabel}>RATING</Text>
          <View style={d.starsRow}>
            {[1, 2, 3, 4, 5].map((r) => (
              <TouchableOpacity key={r} onPress={() => setRating(r)} activeOpacity={0.7} style={d.starHit}>
                <Text style={[d.star, (entry.rating ?? 0) >= r ? d.starOn : d.starOff]}>★</Text>
              </TouchableOpacity>
            ))}
            {entry.rating ? (
              <TouchableOpacity onPress={() => updateShelfEntry(id, { rating: undefined })} activeOpacity={0.7} style={d.clearHit}><Text style={d.clearRating}>Clear</Text></TouchableOpacity>
            ) : null}
          </View>

          {/* ── Notes ──────────────────────────────────── */}
          <Text style={d.sectionLabel}>MY NOTES</Text>
          <TextInput style={d.notes} value={notes} onChangeText={onNotesChange} placeholder="Jot down thoughts, quotes, where you left off, or why you bought this…" placeholderTextColor={colors.ink3} multiline textAlignVertical="top" />

          {!!dates && <Text style={d.dates}>{dates}</Text>}

          <TouchableOpacity style={d.removeBtn} onPress={remove} activeOpacity={0.7}><Text style={d.removeText}>Remove from library</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ProgressSheet book={{ ...book, shelf: entry }} visible={showProgress} onClose={() => setShowProgress(false)} />
    </SafeAreaView>
  );
}

const d = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  content: { paddingHorizontal: 22, paddingBottom: 40 },

  // ── Hero
  hero: { alignItems: 'center', marginTop: 8 },
  coverWrap: { width: 120, marginBottom: 10 },
  link: { fontFamily: fonts.semibold, ...ty.caption, color: colors.ink2, marginBottom: 10 },
  title: { fontFamily: fonts.semibold, ...ty.title, color: colors.ink1, textAlign: 'center' },
  author: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.ink2, marginTop: 6 },
  meta: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 6 },

  editBox: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  editTitle: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink1, textAlign: 'center', backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.line },
  editAuthor: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink1, textAlign: 'center', backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.line },
  editActions: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 2 },
  editCancel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink3 },
  editSave: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink1 },

  // ── Section label
  sectionLabel: { fontFamily: fonts.medium, ...ty.eyebrow, color: colors.ink3, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },

  // ── Chips (status + shelves)
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipEmoji: { fontSize: 15 },
  chipText: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink1 },
  chipTextActive: { color: colors.accentText },
  newShelfChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.lineStrong, borderStyle: 'dashed' },
  newShelfText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },

  // ── Progress
  progressCard: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  progRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progLabel: { fontFamily: fonts.medium, ...ty.body, color: colors.ink1 },
  progPct: { fontFamily: fonts.semibold, ...ty.body, color: colors.ink1 },
  progBar: { height: 8, borderRadius: 999, backgroundColor: colors.chip, marginTop: 14, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent },
  progHint: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 10 },

  // ── Rating
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starHit: { paddingVertical: 2, paddingHorizontal: 2 },
  star: { fontSize: 30 },
  starOn: { color: colors.star },
  starOff: { color: '#DCD6CB' },
  clearHit: { marginLeft: 10, paddingVertical: 6, paddingHorizontal: 6 },
  clearRating: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink3 },

  // ── Notes
  notes: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, minHeight: 130, fontFamily: fonts.regular, ...ty.body, color: colors.ink1, borderWidth: 1, borderColor: colors.line },

  // ── About
  about: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink2 },

  dates: { textAlign: 'center', marginTop: 26, fontFamily: fonts.medium, ...ty.caption, color: colors.ink3 },

  removeBtn: { alignSelf: 'center', marginTop: 14, paddingVertical: 10, paddingHorizontal: 20 },
  removeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },

  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  missingText: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3, textAlign: 'center' },
});
