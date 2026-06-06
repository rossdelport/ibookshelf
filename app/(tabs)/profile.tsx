import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import type { ReadingStatus } from '../../types/book';

const STATUS_LABELS: Record<ReadingStatus, string> = {
  reading: 'Currently Reading',
  read: 'Read',
  want_to_read: 'Want to Read',
  did_not_finish: 'Did Not Finish',
};

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const getShelfBooks = useBookshelfStore((s) => s.getShelfBooks);

  const allBooks = getShelfBooks();
  const reading = getShelfBooks('reading');
  const read = getShelfBooks('read');
  const wantToRead = getShelfBooks('want_to_read');
  const dnf = getShelfBooks('did_not_finish');

  const stats: { label: string; value: number; status: ReadingStatus }[] = [
    { label: STATUS_LABELS.reading, value: reading.length, status: 'reading' },
    { label: STATUS_LABELS.read, value: read.length, status: 'read' },
    { label: STATUS_LABELS.want_to_read, value: wantToRead.length, status: 'want_to_read' },
    { label: STATUS_LABELS.did_not_finish, value: dnf.length, status: 'did_not_finish' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <Text style={styles.avatarText}>📖</Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>My Reading Profile</Text>
        <Text style={[styles.totalLabel, { color: c.textSecondary }]}>{allBooks.length} books total</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.status} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statValue, { color: c.primary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {reading.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Currently Reading</Text>
          {reading.map((book) => (
            <View key={book.id} style={[styles.miniCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.miniTitle, { color: c.text }]}>{book.title}</Text>
              <Text style={[styles.miniAuthor, { color: c.textSecondary }]}>{book.author}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36 },
  name: { fontSize: FontSize.xl, fontWeight: '700' },
  totalLabel: { fontSize: FontSize.md },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: { fontSize: FontSize.xxxl, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, textAlign: 'center', fontWeight: '500' },
  section: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', marginBottom: Spacing.xs },
  miniCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 2,
  },
  miniTitle: { fontSize: FontSize.md, fontWeight: '600' },
  miniAuthor: { fontSize: FontSize.sm },
});
