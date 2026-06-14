import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Sheet } from './Sheet';
import { useBookshelfStore } from '../store/bookshelfStore';
import { colors, fonts, radius, type as ty } from '../constants/theme';
import type { ShelfBook } from '../types/book';

// Fast "where am I" progress logger. Drag the slider or type an exact page;
// +10 nudges; Finished marks the book read. Save commits the current page.
export function ProgressSheet({ book, visible, onClose }: { book: ShelfBook | null; visible: boolean; onClose: () => void }) {
  const updateShelfEntry = useBookshelfStore((s) => s.updateShelfEntry);
  const total = book?.pageCount ?? 0;
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (visible && book) setPage(Math.min(book.shelf.currentPage ?? 0, total || Infinity));
  }, [visible, book, total]);

  if (!book) return null;

  const pct = total ? Math.round((page / total) * 100) : 0;
  const clamp = (n: number) => Math.max(0, total ? Math.min(n, total) : n);

  const onType = (t: string) => setPage(clamp(Number(t.replace(/[^0-9]/g, '')) || 0));
  const bump = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPage((p) => clamp(p + 10)); };

  const now = () => new Date().toISOString();
  const save = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateShelfEntry(book.id, { currentPage: page, status: 'reading', startedAt: book.shelf.startedAt ?? now() });
    onClose();
  };
  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateShelfEntry(book.id, { status: 'read', currentPage: total || page, finishedAt: now(), startedAt: book.shelf.startedAt ?? now() });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Update progress" onSave={save} saveLabel="Save progress">
      <Text style={s.book} numberOfLines={1}>{book.title}</Text>

      <View style={s.readout}>
        <View style={s.pageInputRow}>
          <Text style={s.pageWord}>page</Text>
          <TextInput style={s.pageInput} value={String(page)} onChangeText={onType} keyboardType="number-pad" maxLength={5} returnKeyType="done" />
          {total > 0 && <Text style={s.pageWord}>of {total}</Text>}
        </View>
        {total > 0 && <Text style={s.pct}>{pct}%</Text>}
      </View>

      {total > 0 ? (
        <Slider
          style={s.slider}
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
        <Text style={s.noTotal}>This book has no page count yet — type the page you're on, or mark it finished.</Text>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={s.bumpBtn} onPress={bump} activeOpacity={0.85}>
          <Text style={s.bumpText}>+10</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.finishBtn} onPress={finish} activeOpacity={0.85}>
          <Text style={s.finishText}>Finished ✓</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  book: { fontFamily: fonts.serifItalic, fontSize: 16, color: colors.ink2, marginBottom: 18 },
  readout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageWord: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3 },
  pageInput: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink1, minWidth: 54, textAlign: 'center', backgroundColor: colors.card, borderRadius: radius.chip, borderWidth: 1, borderColor: colors.line, paddingVertical: 6, paddingHorizontal: 10 },
  pct: { fontFamily: fonts.semibold, ...ty.stat, color: colors.ink1 },
  slider: { width: '100%', height: 40, marginTop: 8 },
  noTotal: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, marginTop: 14 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  bumpBtn: { paddingVertical: 13, paddingHorizontal: 22, borderRadius: radius.button, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  bumpText: { fontFamily: fonts.semibold, ...ty.label, color: colors.ink1 },
  finishBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.button, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  finishText: { fontFamily: fonts.semibold, ...ty.label, color: colors.success },
});
