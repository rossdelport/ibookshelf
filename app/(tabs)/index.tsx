import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import type { ReadingStatus, ShelfBook } from '../../types/book';

const FILTERS: { label: string; status: ReadingStatus | 'all' }[] = [
  { label: 'All', status: 'all' },
  { label: 'Reading', status: 'reading' },
  { label: 'Read', status: 'read' },
  { label: 'Want to Read', status: 'want_to_read' },
  { label: 'Did Not Finish', status: 'did_not_finish' },
];

export default function LibraryScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ReadingStatus | 'all'>('all');
  const getShelfBooks = useBookshelfStore((s) => s.getShelfBooks);

  const books = getShelfBooks(activeFilter === 'all' ? undefined : activeFilter);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>My Library</Text>
        <Text style={[styles.count, { color: c.textSecondary }]}>{books.length} books</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.status}
            onPress={() => setActiveFilter(f.status)}
            style={[
              styles.filterChip,
              { borderColor: c.border, backgroundColor: c.surface },
              activeFilter === f.status && { backgroundColor: c.primary, borderColor: c.primary },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: c.textSecondary },
                activeFilter === f.status && { color: '#fff' },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {books.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📖</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No books yet</Text>
          <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
            Search for a book to add it to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookCard book={item} onPress={() => router.push(`/book/${item.id}`)} c={c} />
          )}
        />
      )}
    </View>
  );
}

function BookCard({ book, onPress, c }: { book: ShelfBook; onPress: () => void; c: typeof Colors.light }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.coverPlaceholder, { backgroundColor: c.border }]}>
        <Text style={{ fontSize: 28 }}>📗</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[styles.cardAuthor, { color: c.textSecondary }]} numberOfLines={1}>{book.author}</Text>
        <StatusBadge status={book.shelf.status} c={c} />
      </View>
    </Pressable>
  );
}

function StatusBadge({ status, c }: { status: ReadingStatus; c: typeof Colors.light }) {
  const labels: Record<ReadingStatus, string> = {
    reading: 'Reading',
    read: 'Read',
    want_to_read: 'Want to Read',
    did_not_finish: 'Did Not Finish',
  };
  return (
    <View style={[styles.badge, { backgroundColor: c.primary + '20' }]}>
      <Text style={[styles.badgeText, { color: c.primary }]}>{labels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: '700' },
  count: { fontSize: FontSize.sm },
  filterRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterLabel: { fontSize: FontSize.sm, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '600' },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center', paddingHorizontal: Spacing.xxl },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  coverPlaceholder: {
    width: 56,
    height: 80,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: Spacing.xs },
  cardTitle: { fontSize: FontSize.md, fontWeight: '600' },
  cardAuthor: { fontSize: FontSize.sm },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
});
