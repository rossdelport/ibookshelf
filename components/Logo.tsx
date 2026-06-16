import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

// Pastel five-book-spine brand mark — matches the app icon. Pass `tile` to set
// it on a soft rounded card (an in-app emblem).
const SPINES = ['#E7CBA0', '#9DB4CB', '#B3A7CD', '#D4A7B6', '#A9C3A4'];

export function Logo({ size = 96, tile = false, tileColor = colors.card }: { size?: number; tile?: boolean; tileColor?: string }) {
  const glyph = size * (tile ? 0.78 : 1);

  // Geometry in a 100×100 viewBox: 5 spines centred, the last leaning left.
  const w = 9.4, h = 33, gap = 3.4, r = 3, n = 5;
  const total = n * w + (n - 1) * gap;
  const x0 = (100 - total) / 2;
  const top = (100 - h) / 2;

  const spines = SPINES.map((c, i) => {
    const x = x0 + i * (w + gap);
    if (i === n - 1) {
      // The last spine leans left (rotated about a pivot near its base), which
      // swings its top-left toward the pink spine. Shift it right so the lean
      // still reads but its top-left keeps the same gap as the upright spines.
      const gx = x + 6.86;
      const px = gx + w / 2, py = top + h * 0.94;
      return <Rect key={i} x={gx} y={top} width={w} height={h} rx={r} fill={c} transform={`rotate(-13 ${px} ${py})`} />;
    }
    return <Rect key={i} x={x} y={top} width={w} height={h} rx={r} fill={c} />;
  });

  const svg = <Svg width={glyph} height={glyph} viewBox="0 0 100 100">{spines}</Svg>;
  if (!tile) return svg;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: tileColor, alignItems: 'center', justifyContent: 'center' }}>
      {svg}
    </View>
  );
}
