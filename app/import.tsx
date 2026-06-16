import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { PressableScale } from '../components/anim';
import { useBookshelfStore } from '../store/bookshelfStore';
import { parseLibraryCsv, type ImportFormat, type ImportItem } from '../lib/importLibrary';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

type Phase = 'intro' | 'reading' | 'preview' | 'importing' | 'done' | 'error';

const FORMAT_LABEL: Record<ImportFormat, string> = { goodreads: 'Goodreads', storygraph: 'StoryGraph', generic: 'your export' };

export default function ImportScreen() {
  const importBooks = useBookshelfStore((s) => s.importBooks);

  const [phase, setPhase] = useState<Phase>('intro');
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<{ items: ImportItem[]; format: ImportFormat; total: number } | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [existingCount, setExistingCount] = useState(0);
  const [addedCount, setAddedCount] = useState(0);

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      setPhase('reading');
      const text = await new File(res.assets[0].uri).text();
      const result = parseLibraryCsv(text);
      if (result.items.length === 0) {
        setError('We couldn’t find any books in that file. Make sure it’s the CSV export from Goodreads or StoryGraph.');
        setPhase('error');
        return;
      }
      const shelf = useBookshelfStore.getState().shelf;
      const existing = result.items.filter((it) => shelf[it.book.id]).length;
      setParsed(result);
      setExistingCount(existing);
      setNewCount(result.items.length - existing);
      Haptics.selectionAsync();
      setPhase('preview');
    } catch {
      setError('We couldn’t read that file. Try exporting a fresh CSV and choosing it again.');
      setPhase('error');
    }
  };

  const confirm = () => {
    if (!parsed) return;
    setPhase('importing');
    // Defer so the spinner paints before the (possibly large) bulk insert.
    setTimeout(() => {
      const n = importBooks(parsed.items);
      setAddedCount(n);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('done');
    }, 30);
  };

  const sample = parsed?.items.filter((it) => !useBookshelfStore.getState().shelf[it.book.id]).slice(0, 6) ?? [];

  return (
    <SafeAreaView style={im.safe}>
      <View style={im.topbar}>
        <PressableScale style={im.closeBtn} onPress={() => router.back()}><Text style={im.closeText}>✕</Text></PressableScale>
        <Text style={im.topTitle}>Import library</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={im.content} showsVerticalScrollIndicator={false}>
        {phase === 'intro' && (
          <>
            <Text style={im.h1}>Bring your books with you</Text>
            <Text style={im.lead}>Already track your reading on Goodreads or StoryGraph? Import your whole shelf in one go — titles, authors, ratings, reading status, pages and reviews all come across.</Text>

            <View style={im.steps}>
              <Step n="1" title="Export a CSV" body="Goodreads: My Books → Import/Export → Export Library. StoryGraph: Manage Account → Export StoryGraph Data." />
              <Step n="2" title="Save it to your phone" body="Email it to yourself or save to Files, so you can pick it on this device." />
              <Step n="3" title="Choose the file below" body="We’ll show you what’s found before anything is added." />
            </View>

            <PressableScale style={im.primary} onPress={pick}><Text style={im.primaryText}>Choose CSV file</Text></PressableScale>
            <Text style={im.note}>Nothing is added until you confirm. Books already in your library are skipped.</Text>
          </>
        )}

        {phase === 'reading' && (
          <View style={im.centerPad}>
            <ActivityIndicator color={colors.ink2} />
            <Text style={im.centerText}>Reading your export…</Text>
          </View>
        )}

        {phase === 'preview' && parsed && (
          <>
            <Text style={im.h1}>{newCount > 0 ? `${newCount} book${newCount === 1 ? '' : 's'} ready to add` : 'Nothing new to add'}</Text>
            <Text style={im.lead}>
              Found {parsed.items.length} book{parsed.items.length === 1 ? '' : 's'} in your {FORMAT_LABEL[parsed.format]} export
              {existingCount > 0 ? ` — ${existingCount} already in your library will be skipped.` : '.'}
            </Text>

            {sample.length > 0 && (
              <View style={im.sampleCard}>
                {sample.map((it) => (
                  <View key={it.book.id} style={im.sampleRow}>
                    <Text style={im.sampleTitle} numberOfLines={1}>{it.book.title}</Text>
                    <Text style={im.sampleAuthor} numberOfLines={1}>{it.book.author}</Text>
                  </View>
                ))}
                {newCount > sample.length && <Text style={im.sampleMore}>+ {newCount - sample.length} more</Text>}
              </View>
            )}

            {newCount > 0 ? (
              <PressableScale style={im.primary} onPress={confirm}><Text style={im.primaryText}>Add {newCount} book{newCount === 1 ? '' : 's'}</Text></PressableScale>
            ) : (
              <PressableScale style={im.primary} onPress={() => router.back()}><Text style={im.primaryText}>Done</Text></PressableScale>
            )}
            <PressableScale style={im.secondary} onPress={pick}><Text style={im.secondaryText}>Choose a different file</Text></PressableScale>
          </>
        )}

        {phase === 'importing' && (
          <View style={im.centerPad}>
            <ActivityIndicator color={colors.ink2} />
            <Text style={im.centerText}>Adding your books…</Text>
          </View>
        )}

        {phase === 'done' && (
          <View style={im.centerPad}>
            <Text style={im.bigEmoji}>📚</Text>
            <Text style={im.h1}>{addedCount} book{addedCount === 1 ? '' : 's'} added</Text>
            <Text style={im.lead}>Your imported shelf is ready. Open any book to add a cover, notes and progress.</Text>
            <PressableScale style={im.primary} onPress={() => router.replace('/(tabs)/shelf')}><Text style={im.primaryText}>View my library</Text></PressableScale>
            <PressableScale style={im.secondary} onPress={() => router.back()}><Text style={im.secondaryText}>Done</Text></PressableScale>
          </View>
        )}

        {phase === 'error' && (
          <View style={im.centerPad}>
            <Text style={im.bigEmoji}>🤔</Text>
            <Text style={im.h1}>Couldn’t import that</Text>
            <Text style={im.lead}>{error}</Text>
            <PressableScale style={im.primary} onPress={() => { setError(''); setPhase('intro'); }}><Text style={im.primaryText}>Try again</Text></PressableScale>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={im.step}>
      <View style={im.stepNum}><Text style={im.stepNumText}>{n}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={im.stepTitle}>{title}</Text>
        <Text style={im.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

const im = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  closeBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink2 },
  topTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },

  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  h1: { fontFamily: fonts.semibold, ...ty.title, color: colors.ink1, marginTop: 8 },
  lead: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink2, marginTop: 10 },

  steps: { marginTop: 24, gap: 16 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink1 },
  stepTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  stepBody: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, marginTop: 3 },

  primary: { marginTop: 28, backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 17, alignItems: 'center', ...shadow.button },
  primaryText: { fontFamily: fonts.semibold, ...ty.label, color: colors.accentText },
  secondary: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },
  note: { fontFamily: fonts.regular, ...ty.caption, color: colors.ink3, textAlign: 'center', marginTop: 14 },

  sampleCard: { marginTop: 22, backgroundColor: colors.card, borderRadius: radius.card, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  sampleRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  sampleTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  sampleAuthor: { fontFamily: fonts.serifItalic, fontSize: 13, color: colors.ink2, marginTop: 1 },
  sampleMore: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink3, paddingVertical: 12 },

  centerPad: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 16, gap: 14 },
  centerText: { fontFamily: fonts.medium, ...ty.body, color: colors.ink2 },
  bigEmoji: { fontSize: 48 },
});
