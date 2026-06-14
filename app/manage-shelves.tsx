import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { shelfChipColor } from '../constants/shelfColors';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

export default function ManageShelvesScreen() {
  const shelves = useUserStore((s) => s.profile.shelves);
  const moveShelf = useUserStore((s) => s.moveShelf);
  const shelf = useBookshelfStore((s) => s.shelf);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const entry of Object.values(shelf)) for (const n of entry.shelves ?? []) c[n] = (c[n] ?? 0) + 1;
    return c;
  }, [shelf]);

  return (
    <SafeAreaView style={ms.safe}>
      <View style={ms.topbar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}><Text style={ms.done}>Done</Text></TouchableOpacity>
        <Text style={ms.topTitle}>Manage shelves</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={ms.content} showsVerticalScrollIndicator={false}>
        {shelves.length === 0 ? (
          <View style={ms.empty}>
            <Text style={ms.emptyEmoji}>🗂️</Text>
            <Text style={ms.emptyText}>No shelves yet. Create one to sort your library by person, room, or genre.</Text>
          </View>
        ) : (
          shelves.map((s, i) => (
            <View key={s.name} style={ms.row}>
              <TouchableOpacity style={ms.rowMain} activeOpacity={0.7} onPress={() => router.push({ pathname: '/edit-shelf', params: { name: s.name } })}>
                <View style={[ms.dot, { backgroundColor: shelfChipColor(s.color) }]}><Text style={ms.dotEmoji}>{s.emoji}</Text></View>
                <View style={ms.rowText}>
                  <Text style={ms.rowName} numberOfLines={1}>{s.name}</Text>
                  <Text style={ms.rowMeta}>{counts[s.name] ?? 0} book{(counts[s.name] ?? 0) === 1 ? '' : 's'}</Text>
                </View>
                <Text style={ms.editHint}>Edit</Text>
              </TouchableOpacity>

              <View style={ms.reorder}>
                <TouchableOpacity style={[ms.arrowBtn, i === 0 && ms.arrowDisabled]} onPress={() => moveShelf(s.name, 'up')} disabled={i === 0} activeOpacity={0.7}>
                  <Text style={[ms.arrow, i === 0 && ms.arrowMuted]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ms.arrowBtn, i === shelves.length - 1 && ms.arrowDisabled]} onPress={() => moveShelf(s.name, 'down')} disabled={i === shelves.length - 1} activeOpacity={0.7}>
                  <Text style={[ms.arrow, i === shelves.length - 1 && ms.arrowMuted]}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={ms.newRow} onPress={() => router.push('/new-shelf')} activeOpacity={0.8}>
          <Text style={ms.newText}>＋  New shelf</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ms = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  done: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink2, width: 56 },
  topTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink1 },

  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 40, gap: 10 },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 12 },
  dot: { width: 38, height: 38, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  dotEmoji: { fontSize: 18 },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  rowMeta: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 1 },
  editHint: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },

  reorder: { paddingHorizontal: 10, paddingVertical: 6, gap: 2, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.line, marginLeft: 8 },
  arrowBtn: { width: 30, height: 26, alignItems: 'center', justifyContent: 'center' },
  arrowDisabled: { opacity: 0.4 },
  arrow: { fontSize: 13, color: colors.ink2 },
  arrowMuted: { color: colors.ink3 },

  newRow: { marginTop: 4, paddingVertical: 16, borderRadius: radius.card, alignItems: 'center', borderWidth: 1, borderColor: colors.lineStrong, borderStyle: 'dashed' },
  newText: { fontFamily: fonts.semibold, ...ty.bodySm, color: colors.ink2 },

  empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, textAlign: 'center' },
});
