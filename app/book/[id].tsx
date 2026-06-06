import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import type { Book, ReadingStatus } from '../../types/book';

const STATUS_OPTIONS: { label: string; status: ReadingStatus }[] = [
  { label: 'Want to Read', status: 'want_to_read' },
  { label: 'Currently Reading', status: 'reading' },
  { label: 'Read', status: 'read' },
  { label: 'Did Not Finish', status: 'did_not_finish' },
];

export default function BookDetailScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();

  const addToShelf = useBookshelfStore((s) => s.addToShelf);
  const removeFromShelf = useBookshelfStore((s) => s.removeFromShelf);
  const updateShelfEntry = useBookshelfStore((s) => s.updateShelfEntry);
  const getShelfEntry = useBookshelfStore((s) => s.getShelfEntry);
  const books = useBookshelfStore((s) => s.books);

  const shelfEntry = getShelfEntry(id);
  const storedBook = books[id];

  const book: Book | null = storedBook ?? (data ? JSON.parse(data) : null);

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text }}>Book not found.</Text>
      </View>
    );
  }

  function handleAddToShelf(status: ReadingStatus) {
    addToShelf(book!, status);
  }

  function handleChangeStatus(status: ReadingStatus) {
    updateShelfEntry(book!.id, { status });
  }

  function handleRemove() {
    Alert.alert('Remove from Library', 'Are you sure you want to remove this book?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFromShelf(book!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.coverSection}>
        <View style={[styles.cover, { backgroundColor: c.border }]}>
          <Text style={{ fontSize: 64 }}>📗</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.bookTitle, { color: c.text }]}>{book.title}</Text>
        <Text style={[styles.author, { color: c.textSecondary }]}>{book.author}</Text>

        <View style={styles.metaRow}>
          {book.publishedYear && (
            <MetaPill label={String(book.publishedYear)} c={c} />
          )}
          {book.pageCount && (
            <MetaPill label={`${book.pageCount} pages`} c={c} />
          )}
          {book.genres?.[0] && (
            <MetaPill label={book.genres[0]} c={c} />
          )}
        </View>

        {book.description && (
          <Text style={[styles.description, { color: c.textSecondary }]}>{book.description}</Text>
        )}

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <Text style={[styles.sectionTitle, { color: c.text }]}>
          {shelfEntry ? 'Update Status' : 'Add to Library'}
        </Text>

        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map((opt) => {
            const active = shelfEntry?.status === opt.status;
            return (
              <Pressable
                key={opt.status}
                onPress={() => shelfEntry ? handleChangeStatus(opt.status) : handleAddToShelf(opt.status)}
                style={[
                  styles.statusBtn,
                  { borderColor: c.border, backgroundColor: c.surface },
                  active && { backgroundColor: c.primary, borderColor: c.primary },
                ]}
              >
                <Text style={[styles.statusBtnText, { color: c.text }, active && { color: '#fff' }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {shelfEntry && (
          <Pressable onPress={handleRemove} style={[styles.removeBtn, { borderColor: '#E53E3E' }]}>
            <Text style={[styles.removeBtnText, { color: '#E53E3E' }]}>Remove from Library</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function MetaPill({ label, c }: { label: string; c: typeof Colors.light }) {
  return (
    <View style={[styles.pill, { backgroundColor: c.border }]}>
      <Text style={[styles.pillText, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverSection: { alignItems: 'center', paddingTop: 100, paddingBottom: Spacing.xl },
  cover: {
    width: 140,
    height: 200,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  body: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  bookTitle: { fontSize: FontSize.xxl, fontWeight: '700', textAlign: 'center' },
  author: { fontSize: FontSize.lg, textAlign: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  pillText: { fontSize: FontSize.sm },
  description: { fontSize: FontSize.md, lineHeight: 24 },
  divider: { height: 1, marginVertical: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600' },
  statusGrid: { gap: Spacing.sm },
  statusBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusBtnText: { fontSize: FontSize.md, fontWeight: '500' },
  removeBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  removeBtnText: { fontSize: FontSize.md, fontWeight: '500' },
});
