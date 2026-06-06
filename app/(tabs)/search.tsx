import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { useBookshelfStore } from '../../store/bookshelfStore';
import type { Book } from '../../types/book';

async function searchOpenLibrary(query: string): Promise<Book[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year,subject`
  );
  const data = await res.json();
  return (data.docs ?? []).map((doc: any): Book => ({
    id: doc.key,
    title: doc.title ?? 'Unknown Title',
    author: doc.author_name?.[0] ?? 'Unknown Author',
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    pageCount: doc.number_of_pages_median,
    publishedYear: doc.first_publish_year,
    genres: doc.subject?.slice(0, 3),
  }));
}

export default function SearchScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const addToShelf = useBookshelfStore((s) => s.addToShelf);
  const getShelfEntry = useBookshelfStore((s) => s.getShelfEntry);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const books = await searchOpenLibrary(query.trim());
      setResults(books);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Search</Text>
        <View style={[styles.inputRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="Title, author, or ISBN…"
            placeholderTextColor={c.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          <Pressable onPress={handleSearch} style={[styles.searchBtn, { backgroundColor: c.primary }]}>
            <Text style={styles.searchBtnText}>Go</Text>
          </Pressable>
        </View>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={c.primary} />
        </View>
      )}

      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const onShelf = !!getShelfEntry(item.id);
            return (
              <Pressable
                onPress={() => router.push(`/book/${encodeURIComponent(item.id)}?data=${encodeURIComponent(JSON.stringify(item))}`)}
                style={[styles.result, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <View style={[styles.cover, { backgroundColor: c.border }]}>
                  <Text style={{ fontSize: 24 }}>📗</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.resultTitle, { color: c.text }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[styles.resultAuthor, { color: c.textSecondary }]} numberOfLines={1}>{item.author}</Text>
                  {item.publishedYear && (
                    <Text style={[styles.resultMeta, { color: c.textTertiary }]}>{item.publishedYear}</Text>
                  )}
                </View>
                {onShelf && (
                  <View style={[styles.onShelfBadge, { backgroundColor: c.primary }]}>
                    <Text style={styles.onShelfText}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {!loading && results.length === 0 && query.length > 0 && (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>No results found</Text>
        </View>
      )}

      {!loading && query.length === 0 && (
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>📚</Text>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>Search for any book</Text>
        </View>
      )}
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
    gap: Spacing.md,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: FontSize.md },
  searchBtn: { paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md },
  list: { padding: Spacing.lg, gap: Spacing.md },
  result: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  cover: { width: 48, height: 68, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  resultTitle: { fontSize: FontSize.md, fontWeight: '600' },
  resultAuthor: { fontSize: FontSize.sm },
  resultMeta: { fontSize: FontSize.xs, marginTop: 2 },
  onShelfBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onShelfText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
