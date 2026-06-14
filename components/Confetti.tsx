import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

// Lightweight one-shot confetti that rains from the top. On-palette colours so
// it reads premium, not childish. Mount it (e.g. on a success reveal) and it
// plays once. pointerEvents none so it never blocks taps.

const { width, height } = Dimensions.get('window');
const COLORS = ['#8FA08B', '#B57B5B', '#7A8FA3', '#D9C28A', '#6E5A73', '#2A2622'];

function Piece() {
  const a = useRef(new Animated.Value(0)).current;
  const startX = useMemo(() => Math.random() * width, []);
  const w = useMemo(() => 6 + Math.random() * 5, []);
  const color = useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], []);
  const delay = useMemo(() => Math.random() * 500, []);
  const dur = useMemo(() => 1900 + Math.random() * 1100, []);
  const drift = useMemo(() => (Math.random() * 2 - 1) * 70, []);
  const spins = useMemo(() => 2 + Math.random() * 3, []);

  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: dur, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, [a, dur, delay]);

  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 40] });
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [startX, startX + drift] });
  const rotate = a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spins * 360}deg`] });
  const opacity = a.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });

  return <Animated.View style={{ position: 'absolute', top: 0, left: 0, width: w, height: w * 1.7, borderRadius: 2, backgroundColor: color, opacity, transform: [{ translateX }, { translateY }, { rotate }] }} />;
}

export function Confetti({ count = 28 }: { count?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => <Piece key={i} />)}
    </View>
  );
}
