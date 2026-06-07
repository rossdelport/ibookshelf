import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { SHELF_COLORS, SHELF_DEFAULT } from '../constants/shelfColors';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';
const RED   = '#E0506B';

const EMOJIS = ['📚', '📖', '⭐', '❤️', '🔖', '🎁', '👦', '👧', '👨', '👩', '👵', '👴', '🌿', '🚀', '🐉', '🏛️'];

export default function EditShelfScreen() {
  const { name: original } = useLocalSearchParams<{ name: string }>();
  const shelves = useUserStore((s) => s.profile.shelves);
  const updateShelf = useUserStore((s) => s.updateShelf);
  const removeShelf = useUserStore((s) => s.removeShelf);
  const renameShelfMembership = useBookshelfStore((s) => s.renameShelfMembership);
  const removeShelfMembership = useBookshelfStore((s) => s.removeShelfMembership);

  const def = shelves.find((s) => s.name === original);

  const [name, setName] = useState(def?.name ?? '');
  const [emoji, setEmoji] = useState(def?.emoji ?? '📚');
  const [color, setColor] = useState<string | undefined>(def?.color);

  if (!def) {
    return (
      <SafeAreaView style={es.safe}>
        <View style={es.topbar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={es.cancel}>Close</Text>
          </TouchableOpacity>
          <Text style={es.topTitle}>Edit shelf</Text>
          <View style={{ width: 56 }} />
        </View>
        <View style={es.center}><Text style={es.muted}>This shelf no longer exists.</Text></View>
      </SafeAreaView>
    );
  }

  const trimmed = name.trim();
  // Collision with a *different* shelf (renaming back to your own name is fine).
  const collision = shelves.some((s) => s.name !== original && s.name.toLowerCase() === trimmed.toLowerCase());
  const canSave = !!trimmed && !collision;

  const save = () => {
    if (!canSave) return;
    updateShelf(original, { name: trimmed, emoji, color });
    if (trimmed !== original) renameShelfMembership(original, trimmed);
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert(
      `Delete "${original}"?`,
      'The shelf is removed and unfiled from your books. The books themselves stay in your library.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeShelf(original);
            removeShelfMembership(original);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={es.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={es.topbar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={es.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={es.topTitle}>Edit shelf</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={es.body}>
          <Text style={es.label}>Name</Text>
          <View style={es.field}>
            <Text style={es.fieldEmoji}>{emoji}</Text>
            <TextInput
              style={es.input}
              value={name}
              onChangeText={setName}
              placeholder="Shelf name"
              placeholderTextColor={MUTE}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
          {collision ? (
            <Text style={es.hint}>A shelf called “{trimmed}” already exists.</Text>
          ) : (
            <Text style={es.hint}>Renaming updates every book filed on this shelf.</Text>
          )}

          <Text style={[es.label, { marginTop: 24 }]}>Icon</Text>
          <View style={es.emojiGrid}>
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[es.emojiCell, emoji === e && es.emojiCellActive]}
                onPress={() => setEmoji(e)}
                activeOpacity={0.8}
              >
                <Text style={es.emojiChar}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[es.label, { marginTop: 24 }]}>Colour</Text>
          <View style={es.colorRow}>
            {SHELF_COLORS.map((c) => {
              const selected = color === c.value;
              return (
                <TouchableOpacity
                  key={c.label}
                  style={[es.colorDot, { backgroundColor: c.value ?? SHELF_DEFAULT }, selected && es.colorDotActive]}
                  onPress={() => setColor(c.value)}
                  activeOpacity={0.8}
                >
                  {selected && <Text style={es.colorCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={es.delete} onPress={confirmDelete} activeOpacity={0.7}>
            <Text style={es.deleteText}>Delete shelf</Text>
          </TouchableOpacity>
        </View>

        <View style={es.footer}>
          <TouchableOpacity style={[es.cta, !canSave && es.ctaDisabled]} onPress={save} disabled={!canSave} activeOpacity={0.85}>
            <Text style={es.ctaText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const es = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  cancel: { fontSize: 15, fontWeight: '700', color: MUTE, width: 56 },
  topTitle: { fontSize: 16, fontWeight: '800', color: INK },

  body: { flex: 1, paddingHorizontal: 22, paddingTop: 16 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: '#B08A52', marginBottom: 10 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: WHITE, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  fieldEmoji: { fontSize: 20 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: INK, padding: 0 },
  hint: { fontSize: 12.5, fontWeight: '500', color: MUTE, marginTop: 8, lineHeight: 18 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiCell: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
  },
  emojiCellActive: { borderWidth: 1.5, borderColor: AMBER, backgroundColor: '#FFFBF2' },
  emojiChar: { fontSize: 24 },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: {
    width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.18)',
  },
  colorDotActive: { borderWidth: 2.5, borderColor: WHITE, shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
  colorCheck: { color: WHITE, fontSize: 18, fontWeight: '900' },

  delete: { alignSelf: 'flex-start', marginTop: 28, paddingVertical: 10 },
  deleteText: { fontSize: 14, fontWeight: '800', color: RED },

  footer: { paddingHorizontal: 20, paddingBottom: 16 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaDisabled: { backgroundColor: '#EFE7D8', shadowOpacity: 0, elevation: 0 },
  ctaText: { color: WHITE, fontSize: 16.5, fontWeight: '800', letterSpacing: 0.2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  muted: { fontSize: 15, fontWeight: '600', color: MUTE, textAlign: 'center' },
});
