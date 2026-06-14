import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AvatarFace } from './AvatarFace';
import { PopOnSelect } from './anim';
import { colors, fonts, type as ty, shadow } from '../constants/theme';

export type Gender = 'female' | 'male' | 'unspecified';
export type AvatarDraft = { gender: Gender; skin: string; hairStyle: number; hairColor: string; shirtColor: string };

export const SKIN_TONES = ['#FDDBB4', '#F5C5A3', '#E8A87C', '#D4896A', '#B5622E', '#7D3D1E'];
export const HAIR_COLORS = ['#1A1008', '#5C3317', '#7B4B28', '#B8894A', '#A0382B', '#A8A8A8'];
export const SHIRT_COLORS = ['#232A33', '#8FA08B', '#B57B5B', '#8C8985', '#7A8FA3', '#6E5A73'];
export const NUM_HAIR_STYLES = 6;

export const DEFAULT_DRAFT: AvatarDraft = { gender: 'unspecified', skin: SKIN_TONES[2], hairStyle: 1, hairColor: HAIR_COLORS[1], shirtColor: SHIRT_COLORS[0] };

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'unspecified', label: "Don't specify" },
];

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

function Swatch({ color, selected, onPress, size = 35 }: { color: string; selected: boolean; onPress: () => void; size?: number }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: selected ? 2.5 : 1, borderColor: selected ? colors.accent : colors.line, ...(selected ? shadow.cardSoft : null) }} />
    </TouchableOpacity>
  );
}

function HairStyleSwatch({ index, draft, selected, onPress }: { index: number; draft: AvatarDraft; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={{ width: 43, height: 43, borderRadius: 21.5, borderWidth: selected ? 2.5 : 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: colors.chip, overflow: 'hidden', ...(selected ? shadow.cardSoft : null) }}>
        <AvatarFace skin={draft.skin} hairStyle={index} hairColor={draft.hairColor} shirtColor={draft.shirtColor} size={43} />
      </View>
    </TouchableOpacity>
  );
}

// Controlled avatar-appearance editor — preview + gender + skin/hair/shirt pickers.
// `belowPreview` lets a host (onboarding) slot a name field under the avatar.
export function AvatarBuilder({ value, onChange, previewSize = 132, belowPreview }: { value: AvatarDraft; onChange: (v: AvatarDraft) => void; previewSize?: number; belowPreview?: React.ReactNode }) {
  const set = (patch: Partial<AvatarDraft>) => { tap(); onChange({ ...value, ...patch }); };

  return (
    <View>
      <View style={ab.previewWrap}>
        <AvatarFace skin={value.skin} hairStyle={value.hairStyle} hairColor={value.hairColor} shirtColor={value.shirtColor} size={previewSize} />
      </View>

      {belowPreview}

      <View style={ab.segControl}>
        {GENDERS.map((g) => {
          const on = value.gender === g.key;
          return (
            <PopOnSelect key={g.key} active={on}>
              <TouchableOpacity style={[ab.segBtn, on && ab.segBtnActive]} onPress={() => set({ gender: g.key })} activeOpacity={0.85}>
                <Text style={[ab.segLabel, on && ab.segLabelActive]}>{g.label}</Text>
              </TouchableOpacity>
            </PopOnSelect>
          );
        })}
      </View>

      <Text style={ab.label}>SKIN TONE</Text>
      <View style={ab.row}>
        {SKIN_TONES.map((c) => <Swatch key={c} color={c} selected={value.skin === c} onPress={() => set({ skin: c })} />)}
      </View>

      <Text style={ab.label}>HAIR STYLE</Text>
      <View style={ab.row}>
        {Array.from({ length: NUM_HAIR_STYLES }).map((_, i) => <HairStyleSwatch key={i} index={i} draft={value} selected={value.hairStyle === i} onPress={() => set({ hairStyle: i })} />)}
      </View>

      <Text style={ab.label}>HAIR COLOUR</Text>
      <View style={ab.row}>
        {HAIR_COLORS.map((c) => <Swatch key={c} color={c} selected={value.hairColor === c} onPress={() => set({ hairColor: c })} />)}
      </View>

      <Text style={ab.label}>SHIRT COLOUR</Text>
      <View style={ab.row}>
        {SHIRT_COLORS.map((c) => <Swatch key={c} color={c} selected={value.shirtColor === c} onPress={() => set({ shirtColor: c })} />)}
      </View>
    </View>
  );
}

const ab = StyleSheet.create({
  previewWrap: { alignSelf: 'center', marginTop: 6, borderRadius: 999, ...shadow.card },
  segControl: { flexDirection: 'row', alignSelf: 'center', marginTop: 16, backgroundColor: colors.chip, borderRadius: 999, padding: 4, gap: 2 },
  segBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18 },
  segBtnActive: { backgroundColor: colors.accent },
  segLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink2 },
  segLabelActive: { color: colors.accentText },
  label: { fontFamily: fonts.medium, ...ty.eyebrow, color: colors.ink3, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
});
