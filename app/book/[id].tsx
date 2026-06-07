import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BookCover } from '../../components/BookCover';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import { shelfChipColor } from '../../constants/shelfColors';
import type { ReadingStatus } from '../../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';
const RED   = '#E0506B';

const STATUSES: { key: ReadingStatus; label: string; emoji: string }[] = [
  { key: 'want_to_read',   label: 'To read',  emoji: '📋' },
  { key: 'reading',        label: 'Reading',  emoji: '📖' },
  { key: 'read',           label: 'Finished', emoji: '✅' },
  { key: 'did_not_finish', label: 'DNF',      emoji: '🌙' },
];

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
  const [pageStr, setPageStr] = useState(entry?.currentPage != null ? String(entry.currentPage) : '');
  const [editing, setEditing] = useState(false);
  const [titleStr, setTitleStr] = useState(book?.title ?? '');
  const [authorStr, setAuthorStr] = useState(book?.author ?? '');

  if (!book || !entry) {
    return (
      <SafeAreaView style={d.safe}>
        <View style={d.topbar}>
          <TouchableOpacity style={d.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Chevron />
          </TouchableOpacity>
        </View>
        <View style={d.missing}>
          <Text style={d.missingText}>This book isn't on your shelf anymore.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const setStatus = (status: ReadingStatus) => {
    const now = new Date().toISOString();
    const updates: Parameters<typeof updateShelfEntry>[1] = { status };
    if (status === 'reading' && !entry.startedAt) updates.startedAt = now;
    if (status === 'read') updates.finishedAt = now;
    updateShelfEntry(id, updates);
  };

  const onPageChange = (t: string) => {
    const digits = t.replace(/[^0-9]/g, '');
    setPageStr(digits);
    const max = book.pageCount ?? (Number(digits) || 0);
    updateShelfEntry(id, { currentPage: digits ? Math.min(Number(digits), max) : 0 });
  };

  const onNotesChange = (t: string) => {
    setNotes(t);
    updateShelfEntry(id, { notes: t });
  };

  const remove = () => {
    removeFromShelf(id);
    router.back();
  };

  // Tap a star to set the rating; tap the same one again to clear it.
  const setRating = (r: number) => updateShelfEntry(id, { rating: entry.rating === r ? undefined : r });

  const startEdit = () => {
    setTitleStr(book.title);
    setAuthorStr(book.author);
    setEditing(true);
  };
  const saveEdit = () => {
    const t = titleStr.trim();
    if (!t) return;
    updateBook(id, { title: t, author: authorStr.trim() || 'Unknown author' });
    setEditing(false);
  };

  const pct = book.pageCount ? Math.min((entry.currentPage ?? 0) / book.pageCount, 1) : 0;
  const meta = [book.publishedYear, book.pageCount ? `${book.pageCount} pp` : null, book.genres?.[0]]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={d.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Topbar ───────────────────────────────────── */}
        <View style={d.topbar}>
          <TouchableOpacity style={d.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Chevron />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={d.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ───────────────────────────────────── */}
          <View style={d.hero}>
            <TouchableOpacity
              style={d.coverWrap}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/change-cover', params: { id } })}
            >
              <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} pct={entry.status === 'reading' ? pct : undefined} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/change-cover', params: { id } })} activeOpacity={0.7}>
              <Text style={d.changeCover}>Change cover</Text>
            </TouchableOpacity>

            {editing ? (
              <View style={d.editBox}>
                <TextInput style={d.editTitle} value={titleStr} onChangeText={setTitleStr} placeholder="Title" placeholderTextColor={MUTE} multiline />
                <TextInput style={d.editAuthor} value={authorStr} onChangeText={setAuthorStr} placeholder="Author" placeholderTextColor={MUTE} />
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
                <TouchableOpacity onPress={startEdit} activeOpacity={0.7}>
                  <Text style={d.changeCover}>Edit details</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Reading status ─────────────────────────── */}
          <Text style={d.sectionLabel}>STATUS</Text>
          <View style={d.statusRow}>
            {STATUSES.map((s) => {
              const active = entry.status === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[d.statusChip, active && d.statusChipActive]}
                  onPress={() => setStatus(s.key)}
                  activeOpacity={0.8}
                >
                  <Text style={d.statusEmoji}>{s.emoji}</Text>
                  <Text style={[d.statusText, active && d.statusTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Shelves / collections ──────────────────── */}
          <Text style={d.sectionLabel}>SHELVES</Text>
          <View style={d.statusRow}>
            {(shelfDefs ?? []).map((sh) => {
              const on = (entry.shelves ?? []).includes(sh.name);
              const tint = shelfChipColor(sh.color);
              return (
                <TouchableOpacity
                  key={sh.name}
                  style={[d.statusChip, on && d.statusChipActive, on ? { backgroundColor: tint, borderColor: tint, shadowColor: tint } : null]}
                  onPress={() => toggleBookShelf(id, sh.name)}
                  activeOpacity={0.8}
                >
                  <Text style={d.statusEmoji}>{sh.emoji}</Text>
                  <Text style={[d.statusText, on && d.statusTextActive]}>{sh.name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={d.newShelfChip}
              onPress={() => router.push({ pathname: '/new-shelf', params: { addBook: id } })}
              activeOpacity={0.8}
            >
              <Text style={d.newShelfText}>＋ New shelf</Text>
            </TouchableOpacity>
          </View>

          {/* ── Reading progress (only while reading) ──── */}
          {entry.status === 'reading' && (
            <>
              <Text style={d.sectionLabel}>PROGRESS</Text>
              <View style={d.progressCard}>
                <View style={d.progRow}>
                  <Text style={d.progLabel}>Current page</Text>
                  <View style={d.pageInputWrap}>
                    <TextInput
                      style={d.pageInput}
                      value={pageStr}
                      onChangeText={onPageChange}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={MUTE}
                    />
                    {!!book.pageCount && <Text style={d.pageTotal}>/ {book.pageCount}</Text>}
                  </View>
                </View>
                <View style={d.progBar}>
                  <View style={[d.progFill, { width: `${Math.round(pct * 100)}%` }]} />
                </View>
                <Text style={d.progPct}>{Math.round(pct * 100)}% complete</Text>
              </View>
            </>
          )}

          {/* ── Rating ─────────────────────────────────── */}
          <Text style={d.sectionLabel}>RATING</Text>
          <View style={d.starsRow}>
            {[1, 2, 3, 4, 5].map((r) => (
              <TouchableOpacity key={r} onPress={() => setRating(r)} activeOpacity={0.7} style={d.starHit}>
                <Text style={[d.star, (entry.rating ?? 0) >= r ? d.starOn : d.starOff]}>★</Text>
              </TouchableOpacity>
            ))}
            {entry.rating ? (
              <TouchableOpacity onPress={() => updateShelfEntry(id, { rating: undefined })} activeOpacity={0.7} style={d.clearHit}>
                <Text style={d.clearRating}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Notes ──────────────────────────────────── */}
          <Text style={d.sectionLabel}>MY NOTES</Text>
          <TextInput
            style={d.notes}
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Jot down thoughts, quotes, where you left off, or why you bought this…"
            placeholderTextColor={MUTE}
            multiline
            textAlignVertical="top"
          />

          {/* ── Remove ─────────────────────────────────── */}
          <TouchableOpacity style={d.removeBtn} onPress={remove} activeOpacity={0.7}>
            <Text style={d.removeText}>Remove from library</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const d = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  content: { paddingHorizontal: 22, paddingBottom: 40 },

  // ── Hero
  hero: { alignItems: 'center', marginTop: 8 },
  coverWrap: { width: 120, marginBottom: 10 },
  changeCover: { fontSize: 12.5, fontWeight: '800', color: BROWN, marginBottom: 10 },
  title: { fontFamily: 'Georgia', fontSize: 23, fontWeight: '600', color: INK, textAlign: 'center', lineHeight: 28 },
  author: { fontSize: 14, fontWeight: '700', color: BROWN, marginTop: 6 },
  meta: { fontSize: 12.5, fontWeight: '600', color: MUTE, marginTop: 6 },

  // ── Edit details (title/author)
  editBox: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  editTitle: {
    fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', color: INK, textAlign: 'center',
    backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  editAuthor: {
    fontSize: 15, fontWeight: '600', color: INK, textAlign: 'center',
    backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  editActions: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 2 },
  editCancel: { fontSize: 14, fontWeight: '800', color: MUTE },
  editSave: { fontSize: 14, fontWeight: '800', color: '#C0851E' },

  // ── Rating
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starHit: { paddingVertical: 2, paddingHorizontal: 2 },
  star: { fontSize: 30 },
  starOn: { color: AMBER },
  starOff: { color: 'rgba(139,94,60,0.18)' },
  clearHit: { marginLeft: 10, paddingVertical: 6, paddingHorizontal: 6 },
  clearRating: { fontSize: 13, fontWeight: '700', color: MUTE },

  // ── Section label (§3 caps)
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: '#B08A52',
    letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 28, marginBottom: 12,
  },

  // ── Status chips
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WHITE, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  statusChipActive: {
    backgroundColor: AMBER, borderColor: AMBER,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  statusEmoji: { fontSize: 15 },
  statusText: { fontSize: 14, fontWeight: '700', color: INK },
  statusTextActive: { color: WHITE },

  // New-shelf chip (dashed)
  newShelfChip: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderStyle: 'dashed',
  },
  newShelfText: { fontSize: 14, fontWeight: '800', color: BROWN },

  // ── Progress
  progressCard: {
    backgroundColor: WHITE, borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  progRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progLabel: { fontSize: 14.5, fontWeight: '700', color: INK },
  pageInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageInput: {
    minWidth: 54, textAlign: 'center', fontSize: 15, fontWeight: '800', color: INK,
    backgroundColor: '#F6EFE2', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
  },
  pageTotal: { fontSize: 13.5, fontWeight: '700', color: MUTE },
  progBar: { height: 8, borderRadius: 999, backgroundColor: 'rgba(139,94,60,0.12)', marginTop: 16, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 999, backgroundColor: AMBER },
  progPct: { fontSize: 12.5, fontWeight: '700', color: '#C0851E', marginTop: 8 },

  // ── Notes
  notes: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, minHeight: 130,
    fontSize: 14.5, fontWeight: '500', color: INK, lineHeight: 21,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },

  // ── Remove
  removeBtn: { alignSelf: 'center', marginTop: 28, paddingVertical: 10, paddingHorizontal: 20 },
  removeText: { fontSize: 14, fontWeight: '700', color: RED },

  // ── Missing
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  missingText: { fontSize: 15, fontWeight: '600', color: MUTE, textAlign: 'center' },
});
