import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AvatarFace } from '../../components/AvatarFace';
import { AvatarBuilder, DEFAULT_DRAFT, type AvatarDraft } from '../../components/AvatarBuilder';
import { Sheet } from '../../components/Sheet';
import { CountUp } from '../../components/anim';
import { ANIMALS } from '../../constants/animals';
import { GENRES, genreEmoji } from '../../constants/genres';
import { useUserStore } from '../../store/userStore';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const HAIR_STYLE_NAMES = ['Short crop', 'Curly', 'Bob', 'Long', 'Bun', 'Buzz'];

// Three evocative traits per soul (extends the ANIMALS descriptions)
const TRAITS: Record<string, string[]> = {
  Dragon: ['Ambitious', 'Imaginative', 'Devoted'],
  Wolf: ['Independent', 'Intense', 'Loyal'],
  Eagle: ['Observant', 'Sharp', 'Clear-eyed'],
  Deer: ['Gentle', 'Tender', 'Patient'],
  Fox: ['Curious', 'Quick-witted', 'Mischievous'],
  Owl: ['Wise', 'Deliberate', 'Nocturnal'],
  Raven: ['Perceptive', 'Mysterious', 'Romantic'],
  Panther: ['Focused', 'Patient', 'Relentless'],
  Phoenix: ['Hopeful', 'Reflective', 'Reborn'],
  Griffin: ['Principled', 'Passionate', 'Noble'],
};

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function SectionCard({ title, action, onAction, children, style }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode; style?: object }) {
  return (
    <View style={[pf.card, style]}>
      <View style={pf.cardHead}>
        <Text style={pf.cardTitle}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={8}><Text style={pf.cardAction}>{action}</Text></TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

type SheetKind = null | 'name' | 'avatar' | 'soul' | 'genres';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setUsername, setAvatar, setSoulAnimal, setFavouriteGenres } = useUserStore();

  const avatar = profile.avatar ?? DEFAULT_DRAFT;
  const soul = ANIMALS.find((a) => a.name === profile.soulAnimal) ?? ANIMALS.find((a) => a.name === 'Fox')!;
  const traits = TRAITS[soul.name] ?? TRAITS.Fox;

  // ── Edit sheets ────────────────────────────────────────────────────────────
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft>(DEFAULT_DRAFT);
  const [soulDraft, setSoulDraft] = useState<string>('Fox');
  const [genresDraft, setGenresDraft] = useState<string[]>([]);

  const close = () => setSheet(null);
  const openName = () => { setNameDraft(profile.username ?? ''); setSheet('name'); };
  const openAvatar = () => { setAvatarDraft(profile.avatar ?? DEFAULT_DRAFT); setSheet('avatar'); };
  const openSoul = () => { setSoulDraft(soul.name); setSheet('soul'); };
  const openGenres = () => { setGenresDraft(profile.favouriteGenres); setSheet('genres'); };

  const saved = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const saveName = () => { setUsername(nameDraft); saved(); close(); };
  const saveAvatar = () => { setAvatar(avatarDraft); saved(); close(); };
  const saveSoul = () => { setSoulAnimal(soulDraft); saved(); close(); };
  const saveGenres = () => { setFavouriteGenres(genresDraft); saved(); close(); };
  const toggleGenreDraft = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGenresDraft((g) => (g.includes(label) ? g.filter((x) => x !== label) : [...g, label]));
  };

  // ── Account ────────────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    // Clear session + local/persisted state so logout fully resets and the
    // welcome screen (onboarding start) shows instead of bouncing back to tabs.
    useAuthStore.getState().setSession(null);
    useBookshelfStore.getState().clear();
    useUserStore.getState().reset();
    router.replace('/');
  };
  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in anytime — your library stays backed up in the cloud.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const [deleting, setDeleting] = useState(false);
  const doDeleteAccount = async () => {
    try {
      setDeleting(true);
      // Only hit the server when there's a real account. The testing Skip path
      // has no session, so there's nothing to delete server-side.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.functions.invoke('delete-account');
        if (error) throw error;
      }
      await supabase.auth.signOut().catch(() => {});
      useAuthStore.getState().setSession(null);
      useBookshelfStore.getState().clear();
      useUserStore.getState().reset();
      router.replace('/');
    } catch {
      setDeleting(false);
      Alert.alert('Couldn’t delete account', 'Something went wrong. Please check your connection and try again.');
    }
  };
  const confirmDeleteAccount = () =>
    Alert.alert('Delete account?', 'This permanently deletes your account and your entire library, shelves and notes. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Are you absolutely sure?', 'There’s no way to recover your account or books after this.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete forever', style: 'destructive', onPress: doDeleteAccount },
          ]),
      },
    ]);

  // ── Real reading stats ──────────────────────────────────────────────────────
  const books = useBookshelfStore((s) => s.books);
  const shelf = useBookshelfStore((s) => s.shelf);
  const { ownedCount, readCount, pagesValue } = useMemo(() => {
    const owned = Object.values(shelf).filter((e) => e.status !== 'wishlist');
    const read = owned.filter((e) => e.status === 'read');
    const pages = read.reduce((sum, e) => sum + (books[e.bookId]?.pageCount ?? 0), 0);
    return { ownedCount: owned.length, readCount: read.length, pagesValue: pages >= 1000 ? `${(pages / 1000).toFixed(1)}k` : String(pages) };
  }, [books, shelf]);

  return (
    <View style={pf.fill}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96, paddingTop: insets.top + 16 }}>
        {/* ── Hero ─────────────────────────────────────── */}
        <View style={pf.hero}>
          <TouchableOpacity style={pf.avatarWrap} activeOpacity={0.85} onPress={openAvatar}>
            <View style={pf.avatarRing}>
              <AvatarFace skin={avatar.skin} hairStyle={avatar.hairStyle} hairColor={avatar.hairColor} shirtColor={avatar.shirtColor} size={120} />
            </View>
            <View style={pf.soulBadge}><Text style={pf.soulBadgeEmoji}>{soul.emoji}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={pf.nameRow} onPress={openName} activeOpacity={0.7}>
            <Text style={pf.name}>{profile.username || 'Add your name'}</Text>
            <Text style={pf.namePencil}>✎</Text>
          </TouchableOpacity>
          <Text style={pf.handle}>
            {profile.username ? `@${profile.username.toLowerCase().replace(/\s+/g, '')}` : 'Tap your name to personalise it'}
          </Text>
        </View>

        {/* ── Reading Life ─────────────────────────────── */}
        <SectionCard title="Reading Life">
          <View style={pf.stats}>
            {([{ n: readCount, l: 'Books Read' }, { n: ownedCount, l: 'In Library' }, { t: pagesValue, l: 'Pages Read' }] as { n?: number; t?: string; l: string }[]).map((s, i) => (
              <View key={s.l} style={[pf.stat, i > 0 && pf.statDivider]}>
                {s.n != null ? <CountUp to={s.n} duration={900} style={pf.statV} /> : <Text style={pf.statV}>{s.t}</Text>}
                <Text style={pf.statL}>{s.l}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* ── Soul Animal ──────────────────────────────── */}
        <SectionCard title="Your Soul Animal" action="Change" onAction={openSoul}>
          <View style={pf.soulTop}>
            <View style={pf.soulTile}><Text style={pf.soulTileEmoji}>{soul.emoji}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={pf.soulName}>{soul.name}</Text>
              <Text style={pf.soulKicker}>{titleCase(soul.archetype)}</Text>
            </View>
          </View>
          <Text style={pf.soulDesc}>{soul.description}</Text>
          <View style={pf.traits}>
            {traits.map((t) => <Text key={t} style={pf.trait}>{t}</Text>)}
          </View>
        </SectionCard>

        {/* ── Avatar ───────────────────────────────────── */}
        <SectionCard title="Your Avatar" action="Edit" onAction={openAvatar}>
          <View style={pf.avRow}>
            <View style={pf.avRing}>
              <AvatarFace skin={avatar.skin} hairStyle={avatar.hairStyle} hairColor={avatar.hairColor} shirtColor={avatar.shirtColor} size={84} />
            </View>
            <View style={pf.avSpecs}>
              <View style={pf.spec}><Text style={pf.specK}>Skin</Text><View style={[pf.specDot, { backgroundColor: avatar.skin }]} /></View>
              <View style={pf.spec}><Text style={pf.specK}>Hair</Text><View style={[pf.specDot, { backgroundColor: avatar.hairColor }]} /><Text style={pf.specVText}>{HAIR_STYLE_NAMES[avatar.hairStyle] ?? 'Curly'}</Text></View>
              <View style={pf.spec}><Text style={pf.specK}>Shirt</Text><View style={[pf.specDot, { backgroundColor: avatar.shirtColor }]} /></View>
            </View>
          </View>
        </SectionCard>

        {/* ── Reading Tastes ───────────────────────────── */}
        <SectionCard title="Reading Tastes" action="Edit" onAction={openGenres}>
          {profile.favouriteGenres.length > 0 ? (
            <View style={pf.genres}>
              {profile.favouriteGenres.map((g) => (
                <View key={g} style={pf.genre}><Text style={pf.genreEmoji}>{genreEmoji(g)}</Text><Text style={pf.genreText}>{g}</Text></View>
              ))}
            </View>
          ) : (
            <Text style={pf.tasteEmpty}>Add the genres you love to personalise your library.</Text>
          )}
        </SectionCard>

        {/* ── Account ──────────────────────────────────── */}
        <TouchableOpacity style={pf.signOut} onPress={confirmSignOut} activeOpacity={0.7}>
          <Text style={pf.signOutText}>Sign out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={pf.deleteAccount} onPress={confirmDeleteAccount} activeOpacity={0.7} disabled={deleting}>
          <Text style={pf.deleteAccountText}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
        </TouchableOpacity>
        <Text style={pf.deleteCaption}>Permanently deletes your account, library and notes.</Text>
      </ScrollView>

      {/* ── Edit sheets ──────────────────────────────────────────────────────── */}
      <Sheet visible={sheet === 'name'} onClose={close} title="Your name" onSave={saveName}>
        <TextInput style={pf.nameInput} value={nameDraft} onChangeText={setNameDraft} placeholder="Your name" placeholderTextColor={colors.ink3} autoFocus maxLength={30} returnKeyType="done" onSubmitEditing={saveName} />
      </Sheet>

      <Sheet visible={sheet === 'avatar'} onClose={close} title="Edit your avatar" onSave={saveAvatar}>
        <AvatarBuilder value={avatarDraft} onChange={setAvatarDraft} previewSize={120} />
      </Sheet>

      <Sheet visible={sheet === 'soul'} onClose={close} title="Your soul animal" onSave={saveSoul}>
        <View style={pf.soulGrid}>
          {ANIMALS.map((a) => {
            const on = soulDraft === a.name;
            return (
              <Pressable key={a.name} style={[pf.soulPick, on && pf.soulPickOn]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSoulDraft(a.name); }}>
                <Text style={pf.soulPickEmoji}>{a.emoji}</Text>
                <Text style={[pf.soulPickName, on && pf.soulPickNameOn]}>{a.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet visible={sheet === 'genres'} onClose={close} title="Reading tastes" onSave={saveGenres}>
        <View style={pf.chipWrap}>
          {GENRES.map(({ label, emoji }) => {
            const on = genresDraft.includes(label);
            return (
              <Pressable key={label} style={[pf.chip, on && pf.chipOn]} onPress={() => toggleGenreDraft(label)}>
                <Text style={pf.chipEmoji}>{emoji}</Text>
                <Text style={[pf.chipLabel, on && pf.chipLabelOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const pf = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },

  // ── Hero
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingBottom: 8 },
  avatarWrap: { width: 128, height: 128 },
  avatarRing: { width: 128, height: 128, borderRadius: 64, overflow: 'hidden', borderWidth: 3, borderColor: colors.card, ...shadow.card },
  soulBadge: { position: 'absolute', right: 0, bottom: 2, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.card, ...shadow.cardSoft },
  soulBadgeEmoji: { fontSize: 22 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  name: { fontFamily: fonts.semibold, ...ty.title, color: colors.ink1 },
  namePencil: { fontSize: 15, color: colors.ink3 },
  handle: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 4 },

  // ── Generic card
  card: { marginHorizontal: 18, marginTop: 14, backgroundColor: colors.card, borderRadius: radius.card, padding: 18, borderWidth: 1, borderColor: colors.line, ...shadow.cardSoft },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontFamily: fonts.medium, ...ty.eyebrow, textTransform: 'uppercase', color: colors.ink3 },
  cardAction: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink1 },

  // ── Reading Life
  stats: { flexDirection: 'row', marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  statV: { fontFamily: fonts.semibold, ...ty.stat, color: colors.ink1 },
  statL: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 4 },

  // ── Soul card
  soulTop: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 16 },
  soulTile: { width: 84, height: 84, borderRadius: radius.lg, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  soulTileEmoji: { fontSize: 46 },
  soulName: { fontFamily: fonts.light, ...ty.title, color: colors.ink1 },
  soulKicker: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink3, marginTop: 4 },
  soulDesc: { fontFamily: fonts.regular, ...ty.body, color: colors.ink2, marginTop: 16 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  trait: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.chip, color: colors.ink2, fontFamily: fonts.medium, fontSize: 12.5, overflow: 'hidden' },

  // ── Avatar card
  avRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16 },
  avRing: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', borderWidth: 2, borderColor: colors.card, backgroundColor: colors.chip, ...shadow.cardSoft },
  avSpecs: { flex: 1, gap: 12 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  specK: { width: 44, fontFamily: fonts.medium, ...ty.eyebrow, textTransform: 'uppercase', color: colors.ink3 },
  specVText: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink1 },
  specDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.line },

  // ── Reading Tastes
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  genre: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.chip },
  genreEmoji: { fontSize: 14 },
  genreText: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  tasteEmpty: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, marginTop: 14 },

  // ── Account
  signOut: { alignSelf: 'center', marginTop: 22, paddingVertical: 12, paddingHorizontal: 24 },
  signOutText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink2 },
  deleteAccount: { alignSelf: 'center', marginTop: 2, paddingVertical: 8, paddingHorizontal: 24 },
  deleteAccountText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  deleteCaption: { alignSelf: 'center', fontFamily: fonts.regular, ...ty.caption, color: colors.ink3, marginTop: 2, marginBottom: 6, textAlign: 'center' },

  // ── Sheets
  nameInput: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink1, backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: colors.line },

  soulGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  soulPick: { width: '31%', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: radius.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  soulPickOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1.5 },
  soulPickEmoji: { fontSize: 34 },
  soulPickName: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  soulPickNameOn: { color: colors.ink1, fontFamily: fonts.semibold },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingVertical: 11, paddingHorizontal: 16 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  chipLabelOn: { color: colors.accentText },
});
