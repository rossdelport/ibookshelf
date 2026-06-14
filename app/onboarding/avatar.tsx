import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/userStore';
import { AvatarFace } from '../../components/AvatarFace';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 3; // 4 segments filled (screen 05)

// ── Avatar data ────────────────────────────────────────────────────────────
const SKIN_TONES = ['#FDDBB4', '#F5C5A3', '#E8A87C', '#D4896A', '#B5622E', '#7D3D1E'];
const HAIR_COLORS = ['#1A1008', '#5C3317', '#7B4B28', '#B8894A', '#A0382B', '#A8A8A8'];
// On-palette neutral shirt set.
const SHIRT_COLORS = ['#232A33', '#8FA08B', '#B57B5B', '#8C8985', '#7A8FA3', '#6E5A73'];
const NUM_HAIR_STYLES = 6;

type Gender = 'female' | 'male' | 'unspecified';
const GENDERS: { key: Gender; label: string }[] = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'unspecified', label: "Don't specify" },
];

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={av.chevronWrap}>
      <View style={av.chevronArm1} />
      <View style={av.chevronArm2} />
    </View>
  );
}

/** Ring-selected circle swatch (skin / hair / shirt colors) */
function Swatch({ color, selected, onPress, size = 35 }: { color: string; selected: boolean; onPress: () => void; size?: number }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: selected ? 2.5 : 1,
          borderColor: selected ? colors.accent : colors.line,
          ...(selected ? shadow.cardSoft : null),
        }}
      />
    </TouchableOpacity>
  );
}

/** Mini avatar for the hair-style picker */
function HairStyleSwatch({ index, skin, hairColor, shirtColor, selected, onPress }: { index: number; skin: string; hairColor: string; shirtColor: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        style={{
          width: 43,
          height: 43,
          borderRadius: 21.5,
          borderWidth: selected ? 2.5 : 1,
          borderColor: selected ? colors.accent : colors.line,
          backgroundColor: colors.chip,
          overflow: 'hidden',
          ...(selected ? shadow.cardSoft : null),
        }}
      >
        <AvatarFace skin={skin} hairStyle={index} hairColor={hairColor} shirtColor={shirtColor} size={43} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function AvatarScreen() {
  const { setAvatar, setUsername, profile } = useUserStore();

  const [name, setName] = useState(profile.username ?? '');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [skinIdx, setSkinIdx] = useState(2);
  const [hairStyle, setHairStyle] = useState(1);
  const [hairColorIdx, setHairColorIdx] = useState(1);
  const [shirtIdx, setShirtIdx] = useState(0);

  const skin = SKIN_TONES[skinIdx];
  const hair = HAIR_COLORS[hairColorIdx];
  const shirt = SHIRT_COLORS[shirtIdx];

  const pick = (fn: () => void) => () => { tap(); fn(); };

  return (
    <SafeAreaView style={av.safe}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={av.topbar}>
        <TouchableOpacity style={av.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={av.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[av.seg, i <= CURRENT_STEP && av.segActive]} />
          ))}
        </View>
      </View>

      <ScrollView style={av.scroll} contentContainerStyle={av.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={av.title}>Let's make this yours.</Text>
        <Text style={av.sub}>Create your reader profile.</Text>

        {/* ── Avatar preview ─────────────────────────── */}
        <View style={av.avatarWrap}>
          <AvatarFace skin={skin} hairStyle={hairStyle} hairColor={hair} shirtColor={shirt} size={132} />
        </View>

        {/* ── Name ───────────────────────────────────── */}
        <View style={av.usernameRow}>
          <TextInput
            style={av.username}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.ink3}
            maxLength={30}
            returnKeyType="done"
          />
        </View>

        {/* ── Gender ─────────────────────────────────── */}
        <View style={av.segControl}>
          {GENDERS.map((g) => {
            const on = gender === g.key;
            return (
              <TouchableOpacity key={g.key} style={[av.segBtn, on && av.segBtnActive]} onPress={pick(() => setGender(g.key))} activeOpacity={0.85}>
                <Text style={[av.segLabel, on && av.segLabelActive]}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Skin tone ──────────────────────────────── */}
        <Text style={av.sectionLabel}>SKIN TONE</Text>
        <View style={av.swatchRow}>
          {SKIN_TONES.map((c, i) => (
            <Swatch key={i} color={c} selected={skinIdx === i} onPress={pick(() => setSkinIdx(i))} />
          ))}
        </View>

        {/* ── Hair style ─────────────────────────────── */}
        <Text style={av.sectionLabel}>HAIR STYLE</Text>
        <View style={av.swatchRow}>
          {Array.from({ length: NUM_HAIR_STYLES }).map((_, i) => (
            <HairStyleSwatch key={i} index={i} skin={skin} hairColor={hair} shirtColor={shirt} selected={hairStyle === i} onPress={pick(() => setHairStyle(i))} />
          ))}
        </View>

        {/* ── Hair colour ────────────────────────────── */}
        <Text style={av.sectionLabel}>HAIR COLOUR</Text>
        <View style={av.swatchRow}>
          {HAIR_COLORS.map((c, i) => (
            <Swatch key={i} color={c} selected={hairColorIdx === i} onPress={pick(() => setHairColorIdx(i))} />
          ))}
        </View>

        {/* ── Shirt colour ───────────────────────────── */}
        <Text style={av.sectionLabel}>SHIRT COLOUR</Text>
        <View style={av.swatchRow}>
          {SHIRT_COLORS.map((c, i) => (
            <Swatch key={i} color={c} selected={shirtIdx === i} onPress={pick(() => setShirtIdx(i))} />
          ))}
        </View>
      </ScrollView>

      {/* ── Footer CTA ───────────────────────────────── */}
      <View style={av.footer}>
        <TouchableOpacity
          style={av.cta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setUsername(name);
            setAvatar({ gender, skin, hairStyle, hairColor: hair, shirtColor: shirt });
            router.push('/onboarding/soul');
          }}
          activeOpacity={0.9}
        >
          <Text style={av.ctaText}>Looks good</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const av = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 16 },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  segActive: { backgroundColor: colors.accent },

  // ── Title
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1, marginTop: 22 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginTop: 8 },

  // ── Avatar
  avatarWrap: { alignSelf: 'center', marginTop: 22, borderRadius: 999, ...shadow.card },

  // ── Name
  usernameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  username: {
    fontFamily: fonts.semibold, fontSize: 18, color: colors.ink1, textAlign: 'center', minWidth: 140,
    paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.lineStrong,
  },

  // ── Gender segmented control
  segControl: { flexDirection: 'row', alignSelf: 'center', marginTop: 16, backgroundColor: colors.chip, borderRadius: 999, padding: 4, gap: 2 },
  segBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18 },
  segBtnActive: { backgroundColor: colors.accent },
  segLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink2 },
  segLabelActive: { color: colors.accentText },

  // ── Section labels (eyebrow)
  sectionLabel: { fontFamily: fonts.medium, ...ty.eyebrow, color: colors.ink3, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },

  // ── Swatch rows
  swatchRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },

  // ── Footer
  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
