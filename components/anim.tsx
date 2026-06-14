import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that shrinks slightly while pressed — a tactile, premium tap. */
export function PressableScale({ style, children, scaleTo = 0.96, ...rest }: Omit<ComponentProps<typeof Pressable>, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: React.ReactNode }) {
  const a = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(a, { toValue: v, friction: 7, tension: 220, useNativeDriver: true }).start();
  return (
    <AnimatedPressable onPressIn={() => to(scaleTo)} onPressOut={() => to(1)} style={[style, { transform: [{ scale: a }] }]} {...rest}>
      {children}
    </AnimatedPressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable interaction animations. Native driver wherever possible.
// ─────────────────────────────────────────────────────────────────────────────

/** Fades + slides in from above. Use a staggered `delay` for lists. */
export function FadeIn({ delay = 0, from = -14, duration = 460, style, children }: { delay?: number; from?: number; duration?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay, duration]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Animated number that counts up to `to`, easing out (fast then slow). The
 *  suffix only appears once the value lands, so "$100+" ticks over at the end. */
export function CountUp({ to, duration = 1700, prefix = '', suffix = '', style }: { to: number; duration?: number; prefix?: string; suffix?: string; style?: StyleProp<TextStyle> }) {
  const a = useRef(new Animated.Value(0)).current;
  const [val, setVal] = useState(0);
  useEffect(() => {
    const id = a.addListener(({ value }) => setVal(value));
    Animated.timing(a, { toValue: to, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [a, to, duration]);
  const done = val >= to - 0.5;
  return <Animated.Text style={style}>{prefix}{Math.round(val)}{done ? suffix : ''}</Animated.Text>;
}

/** Slow up/down float — gives an element a calm "breathing" feel. */
export function Breathing({ amplitude = 6, duration = 2600, style, children }: { amplitude?: number; duration?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a, duration]);
  return (
    <Animated.View style={[style, { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Pulses a scale "pop" the moment `active` flips from false → true. */
export function PopOnSelect({ active, style, children }: { active: boolean; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const a = useRef(new Animated.Value(1)).current;
  const prev = useRef(active);
  useEffect(() => {
    if (active && !prev.current) {
      Animated.sequence([
        Animated.timing(a, { toValue: 1.09, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(a, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }),
      ]).start();
    }
    prev.current = active;
  }, [active, a]);
  return <Animated.View style={[style, { transform: [{ scale: a }] }]}>{children}</Animated.View>;
}
