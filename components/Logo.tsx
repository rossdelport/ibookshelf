import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

// Stacked-books brand mark — matches the app icon / website favicon. Pass
// `tile` to render it inside the charcoal rounded square (an app-icon emblem).
export function Logo({ size = 96, color = '#E8A838', tile = false, tileColor = colors.ink1 }: { size?: number; color?: string; tile?: boolean; tileColor?: string }) {
  const glyph = size * (tile ? 0.6 : 1);
  const books = (
    <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={4.5} height={16} rx={1.4} stroke={color} strokeWidth={1.8} />
      <Rect x={9.5} y={4} width={4.5} height={16} rx={1.4} stroke={color} strokeWidth={1.8} />
      <Path d="m16.4 5 3.4 1-2.9 14.2-3.4-1L16.4 5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
  if (!tile) return books;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: tileColor, alignItems: 'center', justifyContent: 'center' }}>
      {books}
    </View>
  );
}
