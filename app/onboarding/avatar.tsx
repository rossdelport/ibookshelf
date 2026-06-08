import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { AvatarFace } from '../../components/AvatarFace';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const TOTAL_STEPS  = 9;
const CURRENT_STEP = 3; // 4 segments filled (screen 05)

// ── Avatar data ────────────────────────────────────────────────────────────
const SKIN_TONES  = ['#FDDBB4', '#F5C5A3', '#E8A87C', '#D4896A', '#B5622E', '#7D3D1E'];
const HAIR_COLORS = ['#1A1008', '#5C3317', '#7B4B28', '#B8894A', '#A0382B', '#A8A8A8'];
// 0=short 1=curly 2=wavy 3=long 4=bun 5=shaved
const NUM_HAIR_STYLES = 6;

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={av.chevronWrap}>
      <View style={av.chevronArm1} />
      <View style={av.chevronArm2} />
    </View>
  );
}

/** Ring-selected circle swatch (skin tones & hair colors) */
function Swatch({
  color,
  selected,
  onPress,
  size = 44,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: selected ? 2 : 0,
        borderColor: AMBER,
        // Outer ring gap: shrink inner dot via padding trick
        shadowColor: selected ? '#E29A2A' : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: selected ? 0.5 : 0,
        shadowRadius: 6,
        elevation: selected ? 3 : 0,
      }}
    />
  );
}

/** Mini avatar for hair-style picker */
function HairStyleSwatch({
  index,
  skin,
  hairColor,
  selected,
  onPress,
}: {
  index: number;
  skin: string;
  hairColor: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? AMBER : 'rgba(139,94,60,0.15)',
        shadowColor: selected ? '#E29A2A' : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: selected ? 0.45 : 0,
        shadowRadius: 6,
        elevation: selected ? 3 : 0,
        backgroundColor: '#F5E6CE',
        overflow: 'hidden',
      }}>
        <AvatarFace skin={skin} hairStyle={index} hairColor={hairColor} size={52} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function AvatarScreen() {
  const { setAvatar, setUsername, profile } = useUserStore();

  const [name,      setName]      = useState(profile.username ?? '');
  const [gender,    setGender]    = useState<'male' | 'female'>('male');
  const [skinIdx,   setSkinIdx]   = useState(2);   // medium by default
  const [hairStyle, setHairStyle] = useState(1);   // curly by default
  const [hairColor, setHairColor] = useState(1);   // dark brown

  const skin = SKIN_TONES[skinIdx];
  const hair = HAIR_COLORS[hairColor];

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

      <ScrollView
        style={av.scroll}
        contentContainerStyle={av.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ──────────────────────────────────── */}
        <Text style={av.title}>Let's make this yours.</Text>
        <Text style={av.sub}>Create your reader profile.</Text>

        {/* ── Avatar preview ─────────────────────────── */}
        <View style={av.avatarWrap}>
          <AvatarFace skin={skin} hairStyle={hairStyle} hairColor={hair} size={128} />
        </View>

        {/* ── Name ───────────────────────────────────── */}
        <View style={av.usernameRow}>
          <TextInput
            style={av.username}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={MUTE}
            maxLength={30}
            returnKeyType="done"
          />
          <Text style={av.editIcon}>🖊</Text>
        </View>

        {/* ── Gender toggle ──────────────────────────── */}
        <View style={av.segControl}>
          <TouchableOpacity
            style={[av.segBtn, gender === 'female' && av.segBtnActive]}
            onPress={() => setGender('female')}
            activeOpacity={0.8}
          >
            <Text style={[av.segLabel, gender === 'female' && av.segLabelActive]}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[av.segBtn, gender === 'male' && av.segBtnActive]}
            onPress={() => setGender('male')}
            activeOpacity={0.8}
          >
            <Text style={[av.segLabel, gender === 'male' && av.segLabelActive]}>Male</Text>
          </TouchableOpacity>
        </View>

        {/* ── Skin tone ──────────────────────────────── */}
        <Text style={av.sectionLabel}>SKIN TONE</Text>
        <View style={av.swatchRow}>
          {SKIN_TONES.map((c, i) => (
            <Swatch key={i} color={c} selected={skinIdx === i} onPress={() => setSkinIdx(i)} />
          ))}
        </View>

        {/* ── Hair style ─────────────────────────────── */}
        <Text style={av.sectionLabel}>HAIR STYLE</Text>
        <View style={av.swatchRow}>
          {Array.from({ length: NUM_HAIR_STYLES }).map((_, i) => (
            <HairStyleSwatch
              key={i}
              index={i}
              skin={skin}
              hairColor={hair}
              selected={hairStyle === i}
              onPress={() => setHairStyle(i)}
            />
          ))}
        </View>

        {/* ── Hair colour ────────────────────────────── */}
        <Text style={av.sectionLabel}>HAIR COLOUR</Text>
        <View style={av.swatchRow}>
          {HAIR_COLORS.map((c, i) => (
            <Swatch key={i} color={c} selected={hairColor === i} onPress={() => setHairColor(i)} />
          ))}
        </View>
      </ScrollView>

      {/* ── Footer CTA ───────────────────────────────── */}
      <View style={av.footer}>
        <TouchableOpacity
          style={av.cta}
          onPress={() => {
            setUsername(name);
            setAvatar({ gender, skin, hairStyle, hairColor: hair });
            router.push('/onboarding/soul');
          }}
          activeOpacity={0.85}
        >
          <Text style={av.ctaText}>Looks good  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const av = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PAPER },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 12 },

  // ── Topbar
  topbar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)',
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: INK, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg:         { flex: 1, height: 3.5, borderRadius: 999, backgroundColor: 'rgba(139,94,60,0.15)' },
  segActive:   { backgroundColor: AMBER },

  // ── Title
  title: { fontSize: 26, fontWeight: '800', color: INK, letterSpacing: -0.4, marginTop: 22 },
  sub:   { fontSize: 14, fontWeight: '500', color: MUTE, marginTop: 6 },

  // ── Avatar
  avatarWrap: {
    alignSelf: 'center', marginTop: 20,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 3,
  },

  // ── Name
  usernameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  username:    {
    fontSize: 17, fontWeight: '800', color: INK, textAlign: 'center', minWidth: 120, paddingVertical: 4, paddingHorizontal: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(139,94,60,0.2)',
  },
  editIcon:    { fontSize: 14 },

  // ── Segmented control (§5 pattern)
  segControl: {
    flexDirection: 'row', alignSelf: 'center', marginTop: 14,
    backgroundColor: '#EFE6D6', borderRadius: 999, padding: 4, gap: 2,
  },
  segBtn:       { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 28 },
  segBtnActive: {
    backgroundColor: AMBER,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
  },
  segLabel:       { fontSize: 14, fontWeight: '700', color: MUTE },
  segLabelActive: { color: WHITE },

  // ── Section labels (§3 "Section label (caps)")
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: '#B08A52',
    letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 20, marginBottom: 10,
  },

  // ── Swatch rows — gap per §4
  swatchRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  // ── Footer
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  cta: {
    backgroundColor: AMBER, borderRadius: 18, paddingVertical: 19, alignItems: 'center',
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
  },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
