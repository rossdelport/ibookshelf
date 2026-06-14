import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';
import { SHELF_COLORS, SHELF_DEFAULT } from '../constants/shelfColors';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

const EMOJIS = ['📚', '📖', '⭐', '❤️', '🔖', '🎁', '👦', '👧', '👨', '👩', '👵', '👴', '🌿', '🚀', '🐉', '🏛️'];

export default function NewShelfScreen() {
  const { addBook } = useLocalSearchParams<{ addBook?: string }>();
  const shelves = useUserStore((s) => s.profile.shelves);
  const addShelf = useUserStore((s) => s.addShelf);
  const toggleBookShelf = useBookshelfStore((s) => s.toggleBookShelf);
  const getShelfEntry = useBookshelfStore((s) => s.getShelfEntry);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [color, setColor] = useState<string | undefined>(undefined);

  const trimmed = name.trim();
  const exists = shelves.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());

  const create = () => {
    if (!trimmed) return;
    addShelf(trimmed, emoji, color);
    if (addBook) {
      const entry = getShelfEntry(addBook);
      if (entry && !(entry.shelves ?? []).includes(trimmed)) toggleBookShelf(addBook, trimmed);
    }
    router.back();
  };

  return (
    <SafeAreaView style={ns.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={ns.topbar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}><Text style={ns.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={ns.topTitle}>New shelf</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={ns.body}>
          <Text style={ns.label}>Name</Text>
          <View style={ns.field}>
            <Text style={ns.fieldEmoji}>{emoji}</Text>
            <TextInput style={ns.input} value={name} onChangeText={setName} placeholder="e.g. Tom's books, Mum & Dad, TBR" placeholderTextColor={colors.ink3} autoFocus maxLength={40} returnKeyType="done" onSubmitEditing={create} />
          </View>
          <Text style={ns.hint}>{exists ? `A shelf called “${trimmed}” already exists.` : 'Sort your library however you like — by person, room, genre, or whose it is.'}</Text>

          <Text style={[ns.label, { marginTop: 24 }]}>Icon</Text>
          <View style={ns.emojiGrid}>
            {EMOJIS.map((e) => (
              <TouchableOpacity key={e} style={[ns.emojiCell, emoji === e && ns.emojiCellActive]} onPress={() => setEmoji(e)} activeOpacity={0.8}>
                <Text style={ns.emojiChar}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[ns.label, { marginTop: 24 }]}>Colour</Text>
          <View style={ns.colorRow}>
            {SHELF_COLORS.map((c) => {
              const selected = color === c.value;
              return (
                <TouchableOpacity key={c.label} style={[ns.colorDot, { backgroundColor: c.value ?? SHELF_DEFAULT }, selected && ns.colorDotActive]} onPress={() => setColor(c.value)} activeOpacity={0.8}>
                  {selected && <Text style={ns.colorCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={ns.footer}>
          <TouchableOpacity style={[ns.cta, !trimmed && ns.ctaDisabled]} onPress={create} disabled={!trimmed} activeOpacity={0.9}>
            <Text style={[ns.ctaText, !trimmed && ns.ctaTextDisabled]}>{exists ? 'Use this shelf' : 'Create shelf'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ns = StyleSheet.create({
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

  footer: { paddingHorizontal: 22, paddingBottom: 16 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaDisabled: { backgroundColor: colors.chip, shadowOpacity: 0, elevation: 0 },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  ctaTextDisabled: { color: colors.ink3 },
});
