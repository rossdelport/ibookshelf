import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BookCover } from '../components/BookCover';
import { CheckIcon } from '../components/icons';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

// ── Floating book covers (constellation hero) ──────────────────────────────
type CoverSpec = { title: string; author: string; width: number; left: `${number}%`; top: `${number}%`; dur: number; delay: number; amp: number; opacity?: number; hero?: boolean };
const COVERS: CoverSpec[] = [
  { hero: true, title: 'Aurelia', author: 'M. Vance', width: 104, left: '50%', top: '44%', dur: 6.6, delay: 0, amp: 12 },
  { title: 'Emberfall', author: 'R. Hale', width: 58, left: '18%', top: '16%', dur: 5.2, delay: 0.4, amp: 9 },
  { title: 'The Tide', author: 'S. Okafor', width: 60, left: '78%', top: '18%', dur: 5.9, delay: 0.9, amp: 10 },
  { title: 'Nightwood', author: 'L. Marsh', width: 50, left: '83%', top: '60%', dur: 4.9, delay: 0.2, amp: 8 },
  { title: 'Saltlight', author: 'A. Frost', width: 46, left: '12%', top: '64%', dur: 6.3, delay: 1.1, amp: 9, opacity: 0.92 },
  { title: 'Wildwood', author: 'T. Reyes', width: 42, left: '46%', top: '84%', dur: 5.0, delay: 0.6, amp: 7 },
];

const BENEFITS = [
  'Unlimited shelves and collections',
  'Custom shelf themes',
  'Reading stats and insights',
  'Your whole library, synced forever',
  'Early access to new features',
];

function FloatCover({ spec }: { spec: CoverSpec }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: 1, duration: spec.dur * 1000, delay: spec.delay * 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: spec.dur * 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [spec.dur, spec.delay, y]);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [-spec.amp, spec.amp] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: spec.left, top: spec.top, marginLeft: -spec.width / 2, marginTop: -spec.width * 0.75, width: spec.width, opacity: spec.opacity ?? 1, transform: [{ translateY }] }}>
      <BookCover title={spec.title} author={spec.author} />
    </Animated.View>
  );
}

function PlanCard({ plan, active, onPick }: { plan: 'yearly' | 'lifetime'; active: boolean; onPick: () => void }) {
  const yearly = plan === 'yearly';
  return (
    <Pressable style={[pw.card, active && pw.cardActive]} onPress={onPick}>
      <View style={[pw.radio, active && pw.radioOn]}>{active && <CheckIcon color={colors.bg} size={11} />}</View>
      <Text style={pw.cardTitle}>{yearly ? 'Yearly' : 'Lifetime'}</Text>
      {yearly ? <Text style={pw.saveBadge}>SAVE 58%</Text> : <View style={{ height: 19, marginTop: 8 }} />}
      <Text style={pw.price}>{yearly ? '$29.99' : '$59.99'}<Text style={pw.priceUnit}>{yearly ? ' /year' : ' once'}</Text></Text>
      <Text style={pw.priceSub}>{yearly ? '7-day free trial, then $2.50/mo' : 'One-time payment'}</Text>
    </Pressable>
  );
}

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<'yearly' | 'lifetime'>('yearly');
  const [bi, setBi] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setBi((i) => (i + 1) % BENEFITS.length);
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 2600);
    return () => clearInterval(t);
  }, [fade]);

  const close = () => router.back();

  // TODO(1.1): wire real StoreKit / RevenueCat purchase + restore here.
  const subscribe = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); close(); };
  const onRestore = () => close();

  const trial = plan === 'yearly';

  return (
    <View style={[pw.screen, { paddingTop: insets.top + 8 }]}>
      <View style={pw.topBar}>
        <Pressable hitSlop={10} onPress={close}><Text style={pw.skip}>Skip</Text></Pressable>
        <View style={pw.pill}>
          <Text style={pw.pillGlyph}>✦</Text>
          <Text style={pw.pillText}>PLUS</Text>
        </View>
        <Pressable hitSlop={10} onPress={onRestore}><Text style={pw.restore}>Restore</Text></Pressable>
      </View>

      <Text style={pw.h1}>Unlock the full story</Text>

      <View style={pw.field}>
        <LinearGradient colors={['rgba(60,48,36,0.08)', 'rgba(60,48,36,0.03)', 'rgba(250,248,244,0)']} style={pw.fieldGlow} />
        {COVERS.map((s, i) => <FloatCover key={i} spec={s} />)}
      </View>

      <View style={pw.benefitWrap}>
        <Animated.Text style={[pw.benefit, { opacity: fade }]}>{BENEFITS[bi]}</Animated.Text>
        <View style={pw.dots}>
          {BENEFITS.map((_, i) => <View key={i} style={[pw.dot, i === bi && pw.dotOn]} />)}
        </View>
      </View>

      <View style={pw.plans}>
        <PlanCard plan="yearly" active={plan === 'yearly'} onPick={() => { Haptics.selectionAsync(); setPlan('yearly'); }} />
        <PlanCard plan="lifetime" active={plan === 'lifetime'} onPick={() => { Haptics.selectionAsync(); setPlan('lifetime'); }} />
      </View>

      <View style={[pw.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable style={pw.cta} onPress={subscribe}>
          <Text style={pw.ctaText}>{trial ? 'Start 7-day free trial' : 'Get Lifetime'}</Text>
        </Pressable>
        <Text style={pw.reassure}>{trial ? '7 days free, then $29.99/year. Cancel anytime.' : '$59.99 billed once. Yours forever.'}</Text>
      </View>
    </View>
  );
}

const pw = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, minHeight: 38 },
  skip: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink3 },
  restore: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingLeft: 11, paddingRight: 15, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  pillGlyph: { fontSize: 11, color: colors.ink2 },
  pillText: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2.5, color: colors.ink2 },

  h1: { fontFamily: fonts.serifItalic, fontSize: 33, lineHeight: 38, letterSpacing: -0.5, color: colors.ink1, textAlign: 'center', marginTop: 12, paddingHorizontal: 36 },

  field: { flex: 1, minHeight: 200, position: 'relative', marginVertical: 4 },
  fieldGlow: { position: 'absolute', left: '8%', right: '8%', top: '4%', bottom: '4%', borderRadius: 999 },

  benefitWrap: { alignItems: 'center', paddingHorizontal: 24 },
  benefit: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2, height: 22 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 11 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.line },
  dotOn: { width: 16, backgroundColor: colors.ink1 },

  plans: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingTop: 18 },
  card: { flex: 1, borderRadius: radius.card, padding: 15, borderWidth: 1.5, borderColor: colors.line },
  cardActive: { borderColor: colors.accent, backgroundColor: colors.card, ...shadow.cardSoft },
  radio: { position: 'absolute', top: 13, right: 13, width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  cardTitle: { fontFamily: fonts.semibold, ...ty.cardTitle, color: colors.ink1 },
  saveBadge: { alignSelf: 'flex-start', marginTop: 8, fontFamily: fonts.semibold, fontSize: 9.5, letterSpacing: 0.6, color: colors.success, backgroundColor: colors.successSoft, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, overflow: 'hidden' },
  price: { fontFamily: fonts.semibold, fontSize: 21, letterSpacing: -0.3, color: colors.ink1, marginTop: 9 },
  priceUnit: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink3 },
  priceSub: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16, color: colors.ink3, marginTop: 4 },

  footer: { paddingHorizontal: 24, paddingTop: 16 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 17, alignItems: 'center', ...shadow.button },
  ctaText: { fontFamily: fonts.semibold, ...ty.label, color: colors.accentText },
  reassure: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.ink3, textAlign: 'center', marginTop: 11, paddingHorizontal: 6 },
});
