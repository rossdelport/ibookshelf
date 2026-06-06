import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const AMBER = '#E8A838';
const PAPER = '#FAF8F3';
const WHITE = '#FFFFFF';

const TOTAL_STEPS  = 10;
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

/** Hair shapes, all positioned inside the 128×128 avatar container.
 *  Head sits at top:20, left:28, width:72, height:76. */
function HairLayer({
  style,
  color,
}: {
  style: number;
  color: string;
}) {
  // Shared head geometry inside the 128px container
  const headTop  = 20;
  const headLeft = 28;
  const headW    = 72;

  switch (style) {
    case 0: // Short crop — flat cap on top of head
      return (
        <View style={{
          position: 'absolute',
          top: headTop - 2,
          left: headLeft + 7,
          width: headW - 14,
          height: 26,
          backgroundColor: color,
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
        }} />
      );
    case 1: // Curly — row of bumps above head
      return (
        <View style={{
          position: 'absolute',
          top: headTop - 14,
          left: headLeft - 2,
          width: headW + 4,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{ width: 14, height: 20, borderRadius: 7, backgroundColor: color }}
            />
          ))}
        </View>
      );
    case 2: // Wavy — wide cap extending beyond head sides
      return (
        <View style={{
          position: 'absolute',
          top: headTop - 6,
          left: headLeft - 6,
          width: headW + 12,
          height: 32,
          backgroundColor: color,
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
        }} />
      );
    case 3: // Long straight — cap + side panels
      return (
        <>
          <View style={{
            position: 'absolute',
            top: headTop - 4,
            left: headLeft + 4,
            width: headW - 8,
            height: 26,
            backgroundColor: color,
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
          }} />
          {/* Side strands */}
          <View style={{ position: 'absolute', top: headTop + 10, left: headLeft - 8, width: 10, height: 44, borderRadius: 5, backgroundColor: color }} />
          <View style={{ position: 'absolute', top: headTop + 10, left: headLeft + headW - 2, width: 10, height: 44, borderRadius: 5, backgroundColor: color }} />
        </>
      );
    case 4: // Bun — cap + elevated bun circle on top
      return (
        <>
          <View style={{
            position: 'absolute',
            top: headTop - 2,
            left: headLeft + 10,
            width: headW - 20,
            height: 20,
            backgroundColor: color,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }} />
          <View style={{
            position: 'absolute',
            top: headTop - 22,
            left: 128 / 2 - 13,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: color,
          }} />
        </>
      );
    case 5: // Shaved — thin stubble line
    default:
      return (
        <View style={{
          position: 'absolute',
          top: headTop,
          left: headLeft + 10,
          width: headW - 20,
          height: 10,
          backgroundColor: color,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          opacity: 0.85,
        }} />
      );
  }
}

function AvatarFace({
  skin,
  hairStyle,
  hairColor,
  size = 128,
}: {
  skin: string;
  hairStyle: number;
  hairColor: string;
  size?: number;
}) {
  // For mini previews we scale proportionally
  const scale  = size / 128;
  const headW  = Math.round(72  * scale);
  const headH  = Math.round(76  * scale);
  const headT  = Math.round(20  * scale);
  const headL  = Math.round((size - headW) / 2);

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#F5E6CE',
      overflow: 'hidden',
    }}>
      {/* Hair (behind head for most styles) */}
      {size === 128 && (
        <HairLayer style={hairStyle} color={hairColor} />
      )}
      {/* Mini preview uses a simplified hair cap only */}
      {size !== 128 && (
        <View style={{
          position: 'absolute',
          top: headT - Math.round(2 * scale),
          left: headL + Math.round(7 * scale),
          width: headW - Math.round(14 * scale),
          height: Math.round(22 * scale),
          backgroundColor: hairColor,
          borderTopLeftRadius: Math.round(30 * scale),
          borderTopRightRadius: Math.round(30 * scale),
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }} />
      )}

      {/* Head */}
      <View style={{
        position: 'absolute',
        top: headT,
        left: headL,
        width: headW,
        height: headH,
        borderRadius: headW / 2,
        backgroundColor: skin,
      }}>
        {/* Eyes */}
        <View style={{
          position: 'absolute',
          top: Math.round(30 * scale),
          left: Math.round(14 * scale),
          width: Math.round(8 * scale),
          height: Math.round(8 * scale),
          borderRadius: Math.round(4 * scale),
          backgroundColor: '#1A1008',
        }} />
        <View style={{
          position: 'absolute',
          top: Math.round(30 * scale),
          right: Math.round(14 * scale),
          width: Math.round(8 * scale),
          height: Math.round(8 * scale),
          borderRadius: Math.round(4 * scale),
          backgroundColor: '#1A1008',
        }} />
        {/* Smile — U-shape via borderBottom trick */}
        <View style={{
          position: 'absolute',
          bottom: Math.round(18 * scale),
          alignSelf: 'center',
          width: Math.round(22 * scale),
          height: Math.round(10 * scale),
          borderBottomLeftRadius: Math.round(11 * scale),
          borderBottomRightRadius: Math.round(11 * scale),
          borderWidth: Math.round(2 * scale),
          borderTopWidth: 0,
          borderColor: '#332C24',
        }} />
      </View>

      {/* Shoulders */}
      <View style={{
        position: 'absolute',
        bottom: -Math.round(8 * scale),
        left: Math.round(14 * scale),
        right: Math.round(14 * scale),
        height: Math.round(42 * scale),
        backgroundColor: skin,
        borderTopLeftRadius: Math.round(40 * scale),
        borderTopRightRadius: Math.round(40 * scale),
      }} />
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
  const { toggleGenre } = useUserStore();

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

        {/* ── Username ───────────────────────────────── */}
        <View style={av.usernameRow}>
          <Text style={av.username}>Ross</Text>
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
          onPress={() => router.push('/onboarding/soul')}
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
  title: { fontSize: 26, fontWeight: '800', color: INK, letterSpacing: -0.4, marginTop: 22, textAlign: 'center' },
  sub:   { fontSize: 14, fontWeight: '500', color: MUTE, textAlign: 'center', marginTop: 6 },

  // ── Avatar
  avatarWrap: {
    alignSelf: 'center', marginTop: 20,
    shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 3,
  },

  // ── Username
  usernameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  username:    { fontSize: 17, fontWeight: '800', color: INK },
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
