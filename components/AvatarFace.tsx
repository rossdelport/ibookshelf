import { View } from 'react-native';

// ── Shared avatar renderer ──────────────────────────────────────────────────
// Procedurally draws the reader avatar from a skin tone, hair style, and hair
// colour. Used by the avatar builder (onboarding/avatar) and anywhere the saved
// avatar is shown (e.g. onboarding/shelf). Scales proportionally from a 128px
// reference so the same geometry works at any `size`.

/** Hair shapes, positioned inside the 128×128 reference container.
 *  Head sits at top:20, left:28, width:72, height:76. */
export function HairLayer({
  style,
  color,
}: {
  style: number;
  color: string;
}) {
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

export function AvatarFace({
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
  // For previews at other sizes we scale proportionally
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
      {/* Full hair geometry at reference size; simplified cap when scaled */}
      {size === 128 ? (
        <HairLayer style={hairStyle} color={hairColor} />
      ) : (
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
