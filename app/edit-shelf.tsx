import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { SHELF_COLORS, SHELF_DEFAULT } from '../constants/shelfColors';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}><Text style={es.cancel}>Close</Text></TouchableOpacity>
          <Text style={es.topTitle}>Edit shelf</Text>
          <View style={{ width: 56 }} />
        </View>
        <View style={es.center}><Text style={es.muted}>This shelf no longer exists.</Text></View>
      </SafeAreaView>
    );
  }

  const trimmed = name.trim();
  const collision = shelves.some((s) => s.name !== original && s.name.toLowerCase() === trimmed.toLowerCase());
  const canSave = !!trimmed && !collision;

  const save = () => {
    if (!canSave) return;
    updateShelf(original, { name: trimmed, emoji, color });
    if (trimmed !== original) renameShelfMembership(original, trimmed);
    router.back();
  };

  const confirmDelete = () =>
    Alert.alert(`Delete "${original}"?`, 'The shelf is removed and unfiled from your books. The books themselves stay in your library.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removeShelf(original); removeShelfMembership(original); router.back(); } },
    ]);

  return (
    <SafeAreaView style={es.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={es.topbar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}><Text style={es.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={es.topTitle}>Edit shelf</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={es.body}>
          <Text style={es.label}>Name</Text>
          <View style={es.field}>
            <Text style={es.fieldEmoji}>{emoji}</Text>
            <TextInput style={es.input} value={name} onChangeText={setName} placeholder="Shelf name" placeholderTextColor={colors.ink3} autoFocus maxLength={40} returnKeyType="done" onSubmitEditing={save} />
          </View>
          <Text style={es.hint}>{collision ? `A shelf called “${trimmed}” already exists.` : 'Renaming updates every book filed on this shelf.'}</Text>

          <Text style={[es.label, { marginTop: 24 }]}>Icon</Text>
          <View style={es.emojiGrid}>
            {EMOJIS.map((e) => (
              <TouchableOpacity key={e} style={[es.emojiCell, emoji === e && es.emojiCellActive]} onPress={() => setEmoji(e)} activeOpacity={0.8}>
                <Text style={es.emojiChar}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[es.label, { marginTop: 24 }]}>Colour</Text>
          <View style={es.colorRow}>
            {SHELF_COLORS.map((c) => {
              const selected = color === c.value;
              return (
                <TouchableOpacity key={c.label} style={[es.colorDot, { backgroundColor: c.value ?? SHELF_DEFAULT }, selected && es.colorDotActive]} onPress={() => setColor(c.value)} activeOpacity={0.8}>
                  {selected && <Text style={es.colorCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={es.delete} onPress={confirmDelete} activeOpacity={0.7}><Text style={es.deleteText}>Delete shelf</Text></TouchableOpacity>
        </View>

        <View style={es.footer}>
          <TouchableOpacity style={[es.cta, !canSave && es.ctaDisabled]} onPress={save} disabled={!canSave} activeOpacity={0.9}>
            <Text style={[es.ctaText, !canSave && es.ctaTextDisabled]}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const es = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  cancel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink3, width: 56 },
  topTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink1 },

  body: { flex: 1, paddingHorizontal: 22, paddingTop: 16 },
  label: { fontFamily: fonts.medium, ...ty.eyebrow, textTransform: 'uppercase', color: colors.ink3, marginBottom: 10 },

  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.line },
  fieldEmoji: { fontSize: 20 },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink1, padding: 0 },
  hint: { fontFamily: fonts.regular, ...ty.caption, color: colors.ink3, marginTop: 8 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiCell: { width: 52, height: 52, borderRadius: radius.card, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  emojiCellActive: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  emojiChar: { fontSize: 24 },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  colorDotActive: { borderWidth: 2.5, borderColor: colors.card, ...shadow.cardSoft },
  colorCheck: { color: '#FFFFFF', fontSize: 18, fontFamily: fonts.semibold },

  delete: { alignSelf: 'flex-start', marginTop: 28, paddingVertical: 10 },
  deleteText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },

  footer: { paddingHorizontal: 22, paddingBottom: 16 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaDisabled: { backgroundColor: colors.chip, shadowOpacity: 0, elevation: 0 },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  ctaTextDisabled: { color: colors.ink3 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  muted: { fontFamily: fonts.medium, ...ty.body, color: colors.ink3, textAlign: 'center' },
});
