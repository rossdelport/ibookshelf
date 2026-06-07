import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useBookshelfStore } from '../store/bookshelfStore';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const EMOJIS = ['📚', '📖', '⭐', '❤️', '🔖', '🎁', '👦', '👧', '👨', '👩', '👵', '👴', '🌿', '🚀', '🐉', '🏛️'];

export default function NewShelfScreen() {
  const { addBook } = useLocalSearchParams<{ addBook?: string }>();
  const shelves = useUserStore((s) => s.profile.shelves);
  const addShelf = useUserStore((s) => s.addShelf);
  const toggleBookShelf = useBookshelfStore((s) => s.toggleBookShelf);
  const getShelfEntry = useBookshelfStore((s) => s.getShelfEntry);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');

  const trimmed = name.trim();
  const exists = shelves.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());

  const create = () => {
    if (!trimmed) return;
    addShelf(trimmed, emoji); // no-op if it already exists
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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={ns.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={ns.topTitle}>New shelf</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={ns.body}>
          <Text style={ns.label}>Name</Text>
          <View style={ns.field}>
            <Text style={ns.fieldEmoji}>{emoji}</Text>
            <TextInput
              style={ns.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tom's books, Mum & Dad, TBR"
              placeholderTextColor={MUTE}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={create}
            />
          </View>
          {exists ? (
            <Text style={ns.hint}>A shelf called “{trimmed}” already exists.</Text>
          ) : (
            <Text style={ns.hint}>Sort your library however you like — by person, room, genre, or whose it is.</Text>
          )}

          <Text style={[ns.label, { marginTop: 24 }]}>Icon</Text>
          <View style={ns.emojiGrid}>
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[ns.emojiCell, emoji === e && ns.emojiCellActive]}
                onPress={() => setEmoji(e)}
                activeOpacity={0.8}
              >
                <Text style={ns.emojiChar}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={ns.footer}>
          <TouchableOpacity style={[ns.cta, !trimmed && ns.ctaDisabled]} onPress={create} disabled={!trimmed} activeOpacity={0.85}>
            <Text style={ns.ctaText}>{exists ? 'Use this shelf  →' : 'Create shelf  →'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ns = StyleSheet.create({
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

  footer: { paddingHorizontal: 20, paddingBottom: 16 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaDisabled: { backgroundColor: '#EFE7D8', shadowOpacity: 0, elevation: 0 },
  ctaText: { color: WHITE, fontSize: 16.5, fontWeight: '800', letterSpacing: 0.2 },
});
