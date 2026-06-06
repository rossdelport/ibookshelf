import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';

// ── Generative book cover (DESIGN.md §5 "Generative cover") ────────────────
// Recreates the design's `.bcover`: a jewel-tone gradient spine-lit cover with
// a Lora frame (title · diamond · author). When `pct` is provided it shows the
// amber "currently reading" bookmark + a progress bar.

// Lighten (pct>0) / darken (pct<0) a #rrggbb toward white/black.
function shade(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const target = pct < 0 ? 0 : 255;
  const p = Math.abs(pct);
  r = Math.round((target - r) * p + r);
  g = Math.round((target - g) * p + g);
  b = Math.round((target - b) * p + b);
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function BookCover({
  title,
  author,
  bg,
  ink,
  pct,
}: {
  title: string;
  author: string;
  bg: string;
  ink: string;
  pct?: number;
}) {
  const reading = typeof pct === 'number';

  return (
    <View style={bc.shadowWrap}>
      <LinearGradient
        colors={[shade(bg, 0.15), bg, shade(bg, -0.24)]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={bc.cover}
      >
        {/* Spine shading (inset-left) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.34)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.32, y: 0.5 }}
          style={bc.spine}
        />

        {/* Frame */}
        <View style={[bc.frame, { borderColor: hexToRgba(ink, 0.52) }]}>
          <Text style={[bc.title, { color: ink }]} numberOfLines={3}>{title.toUpperCase()}</Text>
          <Text style={[bc.dia, { color: ink }]}>◇</Text>
          <Text style={[bc.author, { color: ink }]} numberOfLines={2}>{author.toUpperCase()}</Text>
        </View>

        {/* Currently-reading bookmark + progress */}
        {reading && (
          <>
            <Svg width={11} height={23} style={bc.mark} viewBox="0 0 11 23">
              <Polygon points="0,0 11,0 11,23 5.5,18 0,23" fill="#E8A838" />
            </Svg>
            <View style={bc.prog}>
              <View style={[bc.progFill, { width: `${Math.round(pct! * 100)}%` }]} />
            </View>
          </>
        )}
      </LinearGradient>
    </View>
  );
}

const bc = StyleSheet.create({
  shadowWrap: {
    flex: 1,
    shadowColor: '#462D0F',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  cover: {
    aspectRatio: 2 / 3,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    overflow: 'hidden',
  },
  spine: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  frame: {
    position: 'absolute',
    top: 6, left: 6, right: 6, bottom: 6,
    borderWidth: 1.4,
    borderRadius: 2,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  title: {
    marginTop: '20%',
    fontFamily: 'Georgia',
    fontWeight: '600',
    letterSpacing: 0.8,
    fontSize: 12.5,
    lineHeight: 15,
    textAlign: 'center',
  },
  dia: { marginTop: 8, fontSize: 9, opacity: 0.7 },
  author: {
    marginTop: 'auto',
    fontFamily: 'Georgia',
    letterSpacing: 0.6,
    fontSize: 7,
    lineHeight: 9,
    textAlign: 'center',
    opacity: 0.85,
  },
  mark: { position: 'absolute', top: -1, right: 13, zIndex: 3 },
  prog: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(0,0,0,0.32)', zIndex: 3 },
  progFill: { height: '100%', backgroundColor: '#E8A838' },
});
