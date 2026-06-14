import { View } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Procedural reader avatar. Everything is derived from a 128px reference and
// scaled by `size/128`, so all six hair styles, the refined face, and the shirt
// render correctly at ANY size. Drawn back-to-front:
//   long-hair length (behind body) → shirt+neck → back hair → head+face → front hair
// Styles: 0 short · 1 curly · 2 bob · 3 long · 4 bun · 5 buzz.
// ─────────────────────────────────────────────────────────────────────────────

const FACE_TILE = '#F2E8D6'; // warm cream behind the portrait
const EYE = '#3B2F27';
const MOUTH = '#6E5848';
const DEFAULT_SHIRT = '#232A33';

// Head geometry in the 128 reference space.
const HEAD = { w: 64, h: 70, top: 20 };
const CX = 64; // horizontal centre

type HairProps = { style: number; color: string; sc: (n: number) => number; layer: 'behind' | 'back' | 'front' };

/** Hair pieces, layered so styles sit naturally around the face and body:
 *  behind = length that falls down the back (drawn under the shirt);
 *  back   = volume/frame behind the head; front = caps, fringe, bun, curls. */
function Hair({ style, color, sc, layer }: HairProps) {
  const left = CX - HEAD.w / 2; // 32

  if (layer === 'behind') {
    // Long hair falls down the back — drawn beneath the shirt + neck so it never
    // covers the face, neck, or chest; it only frames the head and shoulders.
    if (style === 3) {
      return <View style={{ position: 'absolute', top: sc(HEAD.top - 6), left: sc(left - 10), width: sc(HEAD.w + 20), height: sc(72), backgroundColor: color, borderTopLeftRadius: sc(34), borderTopRightRadius: sc(34), borderBottomLeftRadius: sc(24), borderBottomRightRadius: sc(24) }} />;
    }
    return null;
  }

  if (layer === 'back') {
    switch (style) {
      case 1: // curly — round halo
        return <View style={{ position: 'absolute', top: sc(HEAD.top - 10), left: sc(left - 8), width: sc(HEAD.w + 16), height: sc(HEAD.h * 0.7), borderRadius: sc(HEAD.w), backgroundColor: color }} />;
      case 2: // bob — rounded chin-length frame around the face
        return <View style={{ position: 'absolute', top: sc(HEAD.top - 6), left: sc(left - 6), width: sc(HEAD.w + 12), height: sc(72), backgroundColor: color, borderTopLeftRadius: sc(34), borderTopRightRadius: sc(34), borderBottomLeftRadius: sc(28), borderBottomRightRadius: sc(28) }} />;
      default:
        return null;
    }
  }

  // layer === 'front'
  switch (style) {
    case 0: // short crop — neat cap + temples
      return (
        <>
          <View style={{ position: 'absolute', top: sc(HEAD.top - 4), left: sc(left + 2), width: sc(HEAD.w - 4), height: sc(28), backgroundColor: color, borderTopLeftRadius: sc(32), borderTopRightRadius: sc(32), borderBottomLeftRadius: sc(8), borderBottomRightRadius: sc(8) }} />
          <View style={{ position: 'absolute', top: sc(HEAD.top + 6), left: sc(left + 1), width: sc(7), height: sc(20), borderRadius: sc(4), backgroundColor: color }} />
          <View style={{ position: 'absolute', top: sc(HEAD.top + 6), left: sc(left + HEAD.w - 8), width: sc(7), height: sc(20), borderRadius: sc(4), backgroundColor: color }} />
        </>
      );
    case 1: // curly — row of soft bumps along the hairline
      return (
        <View style={{ position: 'absolute', top: sc(HEAD.top - 12), left: sc(left - 4), width: sc(HEAD.w + 8), flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ width: sc(13), height: sc(17), borderRadius: sc(7), backgroundColor: color }} />
          ))}
        </View>
      );
    case 2: // bob — straight fringe across the forehead
      return <View style={{ position: 'absolute', top: sc(HEAD.top - 4), left: sc(left + 1), width: sc(HEAD.w - 2), height: sc(22), backgroundColor: color, borderTopLeftRadius: sc(30), borderTopRightRadius: sc(30), borderBottomLeftRadius: sc(8), borderBottomRightRadius: sc(8) }} />;
    case 3: // long — top cap (the back/behind layers carry the length)
      return <View style={{ position: 'absolute', top: sc(HEAD.top - 4), left: sc(left + 2), width: sc(HEAD.w - 4), height: sc(26), backgroundColor: color, borderTopLeftRadius: sc(32), borderTopRightRadius: sc(32), borderBottomLeftRadius: sc(6), borderBottomRightRadius: sc(6) }} />;
    case 4: // bun — cap + raised bun
      return (
        <>
          <View style={{ position: 'absolute', top: sc(HEAD.top - 2), left: sc(left + 6), width: sc(HEAD.w - 12), height: sc(20), backgroundColor: color, borderTopLeftRadius: sc(28), borderTopRightRadius: sc(28) }} />
          <View style={{ position: 'absolute', top: sc(HEAD.top - 20), left: sc(CX - 11), width: sc(22), height: sc(22), borderRadius: sc(11), backgroundColor: color }} />
        </>
      );
    case 5: // buzz / shaved — close stubble cap
    default:
      return <View style={{ position: 'absolute', top: sc(HEAD.top - 1), left: sc(left + 6), width: sc(HEAD.w - 12), height: sc(13), backgroundColor: color, opacity: 0.9, borderTopLeftRadius: sc(28), borderTopRightRadius: sc(28), borderBottomLeftRadius: sc(4), borderBottomRightRadius: sc(4) }} />;
  }
}

export function AvatarFace({
  skin,
  hairStyle,
  hairColor,
  shirtColor = DEFAULT_SHIRT,
  size = 128,
}: {
  skin: string;
  hairStyle: number;
  hairColor: string;
  shirtColor?: string;
  size?: number;
}) {
  const scale = size / 128;
  const sc = (n: number) => n * scale;
  const headLeft = CX - HEAD.w / 2;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: FACE_TILE, overflow: 'hidden' }}>
      {/* Long hair length — behind the body */}
      <Hair style={hairStyle} color={hairColor} sc={sc} layer="behind" />

      {/* Shirt + neck */}
      <View style={{ position: 'absolute', top: sc(HEAD.top + HEAD.h - 12), left: sc(CX - 12), width: sc(24), height: sc(26), backgroundColor: skin }} />
      <View style={{ position: 'absolute', bottom: 0, left: sc(6), right: sc(6), height: sc(40), backgroundColor: shirtColor, borderTopLeftRadius: sc(46), borderTopRightRadius: sc(46) }} />
      <View style={{ position: 'absolute', bottom: sc(28), left: sc(CX - 13), width: sc(26), height: sc(16), borderBottomLeftRadius: sc(14), borderBottomRightRadius: sc(14), backgroundColor: skin }} />

      {/* Hair behind the head */}
      <Hair style={hairStyle} color={hairColor} sc={sc} layer="back" />

      {/* Head */}
      <View style={{ position: 'absolute', top: sc(HEAD.top), left: sc(headLeft), width: sc(HEAD.w), height: sc(HEAD.h), borderRadius: sc(HEAD.w * 0.48), backgroundColor: skin }}>
        <View style={{ position: 'absolute', top: sc(30), left: sc(15), width: sc(6), height: sc(7.5), borderRadius: sc(3), backgroundColor: EYE }} />
        <View style={{ position: 'absolute', top: sc(30), right: sc(15), width: sc(6), height: sc(7.5), borderRadius: sc(3), backgroundColor: EYE }} />
        <View style={{ position: 'absolute', bottom: sc(15), alignSelf: 'center', width: sc(17), height: sc(8), borderBottomLeftRadius: sc(10), borderBottomRightRadius: sc(10), borderWidth: sc(1.6), borderTopWidth: 0, borderColor: MOUTH }} />
      </View>

      {/* Hair in front of the head */}
      <Hair style={hairStyle} color={hairColor} sc={sc} layer="front" />
    </View>
  );
}
