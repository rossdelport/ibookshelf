import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { shelfChipColor } from '../constants/shelfColors';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

export default function ManageShelvesScreen() {
  const shelves = useUserStore((s) => s.profile.shelves);
  const moveShelf = useUserStore((s) => s.moveShelf);
  const shelf = useBookshelfStore((s) => s.shelf);

  // Book count per shelf name (entries filed on it).
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const entry of Object.values(shelf)) {
      for (const n of entry.shelves ?? []) c[n] = (c[n] ?? 0) + 1;
    }
    return c;
  }, [shelf]);

  return (
    <SafeAreaView style={ms.safe}>
      <View style={ms.topbar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={ms.cancel}>Done</Text>
        </TouchableOpacity>
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
              <TouchableOpacity
                style={ms.rowMain}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/edit-shelf', params: { name: s.name } })}
              >
                <View style={[ms.dot, { backgroundColor: shelfChipColor(s.color) }]}>
                  <Text style={ms.dotEmoji}>{s.emoji}</Text>
                </View>
                <View style={ms.rowText}>
                  <Text style={ms.rowName} numberOfLines={1}>{s.name}</Text>
                  <Text style={ms.rowMeta}>{counts[s.name] ?? 0} book{(counts[s.name] ?? 0) === 1 ? '' : 's'}</Text>
                </View>
                <Text style={ms.editHint}>Edit</Text>
              </TouchableOpacity>

              <View style={ms.reorder}>
                <TouchableOpacity
                  style={[ms.arrowBtn, i === 0 && ms.arrowDisabled]}
                  onPress={() => moveShelf(s.name, 'up')}
                  disabled={i === 0}
                  activeOpacity={0.7}
                >
                  <Text style={[ms.arrow, i === 0 && ms.arrowMuted]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ms.arrowBtn, i === shelves.length - 1 && ms.arrowDisabled]}
                  onPress={() => moveShelf(s.name, 'down')}
                  disabled={i === shelves.length - 1}
                  activeOpacity={0.7}
                >
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
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  cancel: { fontSize: 15, fontWeight: '700', color: BROWN, width: 56 },
  topTitle: { fontSize: 16, fontWeight: '800', color: INK },

  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 10 },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 16,
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 12 },
  dot: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotEmoji: { fontSize: 18 },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '800', color: INK },
  rowMeta: { fontSize: 12.5, fontWeight: '600', color: MUTE, marginTop: 1 },
  editHint: { fontSize: 13, fontWeight: '800', color: BROWN },

  reorder: { paddingHorizontal: 10, paddingVertical: 6, gap: 2, borderLeftWidth: 0.5, borderLeftColor: 'rgba(139,94,60,0.10)', marginLeft: 8 },
  arrowBtn: { width: 30, height: 26, alignItems: 'center', justifyContent: 'center' },
  arrowDisabled: { opacity: 0.4 },
  arrow: { fontSize: 13, fontWeight: '900', color: BROWN },
  arrowMuted: { color: MUTE },

  newRow: {
    marginTop: 4, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderStyle: 'dashed',
  },
  newText: { fontSize: 14.5, fontWeight: '800', color: BROWN },

  empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { fontSize: 14.5, fontWeight: '500', color: MUTE, textAlign: 'center', lineHeight: 21 },
});
