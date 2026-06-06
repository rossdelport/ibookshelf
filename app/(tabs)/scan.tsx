import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { CheckIcon, CloseIcon, FlashIcon, HeartIcon, KeyboardIcon, ShelfIcon } from '../../components/icons';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';
const GREEN = '#5BA66E';

const COVER = require('../../assets/images/bk_acotar.png');
const FOUND = {
  title: 'A Court of Thorns and Roses',
  author: 'Sarah J. Maas',
  meta: '2015 · Bloomsbury · 419 pp',
};

const RETICLE_H = 300;

type Mode = 'aim' | 'scanning' | 'result' | 'shelf' | 'wishlist';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('aim');
  const [flash, setFlash] = useState(false);

  const sweep = useRef(new Animated.Value(0)).current;
  const spin  = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(34)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSheet = mode === 'result' || mode === 'shelf' || mode === 'wishlist';
  const added = mode === 'shelf' || mode === 'wishlist';

  // Scanning loops (scan line + spinner)
  useEffect(() => {
    if (mode !== 'scanning') return;
    const line = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const spinner = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }));
    line.start(); spinner.start();
    return () => { line.stop(); spinner.stop(); };
  }, [mode, sweep, spin]);

  // Sheet rise when a result appears
  useEffect(() => {
    if (showSheet) {
      sheetY.setValue(34);
      Animated.timing(sheetY, { toValue: 0, duration: 340, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
    }
  }, [showSheet, sheetY]);

  // Confirmation check pop
  useEffect(() => {
    if (added) {
      checkScale.setValue(0);
      Animated.timing(checkScale, { toValue: 1, duration: 400, easing: Easing.bezier(0.22, 1.4, 0.4, 1), useNativeDriver: true }).start();
    }
  }, [added, checkScale]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const capture = () => {
    setMode('scanning');
    timer.current = setTimeout(() => setMode('result'), 1500);
  };
  const reset = () => setMode('aim');

  const lineY = sweep.interpolate({ inputRange: [0, 1], outputRange: [RETICLE_H * 0.04, RETICLE_H * 0.96] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scanning = mode === 'scanning';
  const cornerColor = scanning ? AMBER : WHITE;

  return (
    <View style={sc.root}>
      {/* ── Top bar ───────────────────────────────────── */}
      <View style={[sc.top, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={sc.topBtn} onPress={reset} activeOpacity={0.7}><CloseIcon color={WHITE} /></TouchableOpacity>
        <Text style={sc.topTitle}>Scan a Book</Text>
        <TouchableOpacity style={[sc.topBtn, flash && sc.topBtnOn]} onPress={() => setFlash((f) => !f)} activeOpacity={0.7}>
          <FlashIcon color={flash ? INK : WHITE} />
        </TouchableOpacity>
      </View>

      {/* ── Viewfinder ────────────────────────────────── */}
      <View style={sc.view}>
        {/* Scene */}
        <LinearGradient colors={['#2A2320', '#14100C', '#0B0805']} locations={[0, 0.7, 1]} style={StyleSheet.absoluteFill} />
        <View style={sc.scene}>
          <Image source={COVER} style={sc.book} resizeMode="cover" />
        </View>
        {/* Amber glow + vignette */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="46%" rx="60%" ry="44%">
              <Stop offset="0" stopColor={AMBER} stopOpacity="0.12" />
              <Stop offset="1" stopColor={AMBER} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="vig" cx="50%" cy="50%" rx="75%" ry="75%">
              <Stop offset="0.55" stopColor="#000" stopOpacity="0" />
              <Stop offset="1" stopColor="#000" stopOpacity="0.6" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#glow)" />
          <Rect width="100%" height="100%" fill="url(#vig)" />
        </Svg>

        {/* Reticle */}
        <View style={sc.reticle}>
          <View style={[sc.corner, sc.cornerTL, { borderColor: cornerColor }]} />
          <View style={[sc.corner, sc.cornerTR, { borderColor: cornerColor }]} />
          <View style={[sc.corner, sc.cornerBL, { borderColor: cornerColor }]} />
          <View style={[sc.corner, sc.cornerBR, { borderColor: cornerColor }]} />
          {scanning && <Animated.View style={[sc.scanLine, { transform: [{ translateY: lineY }] }]} />}
        </View>

        {/* Hint */}
        {mode === 'aim' && (
          <View style={sc.hint}><Text style={sc.hintText}>Center the cover inside the frame</Text></View>
        )}
        {scanning && (
          <View style={sc.hint}>
            <Animated.View style={[sc.spinner, { transform: [{ rotate: spinDeg }] }]} />
            <Text style={[sc.hintText, { color: '#FBE6BE' }]}>Identifying…</Text>
          </View>
        )}
      </View>

      {/* ── Capture controls ──────────────────────────── */}
      {!showSheet && (
        <View style={[sc.controls, { paddingBottom: 18 }]}>
          <TouchableOpacity style={sc.mini} activeOpacity={0.7}>
            <View style={sc.gallery} />
            <Text style={sc.miniLabel}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sc.shutter} onPress={capture} disabled={scanning} activeOpacity={0.8}>
            <View style={sc.shutterIn} />
          </TouchableOpacity>
          <TouchableOpacity style={sc.mini} activeOpacity={0.7}>
            <KeyboardIcon color={WHITE} />
            <Text style={sc.miniLabel}>Enter ISBN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Result / confirmation sheet ───────────────── */}
      {showSheet && (
        <Animated.View style={[sc.sheet, { paddingBottom: 24, transform: [{ translateY: sheetY }] }]}>
          {!added ? (
            <>
              <View style={sc.tag}><View style={sc.tagDot} /><Text style={sc.tagText}>Match found · 98%</Text></View>
              <View style={sc.found}>
                <Image source={COVER} style={sc.foundImg} resizeMode="cover" />
                <View style={sc.foundTxt}>
                  <Text style={sc.foundTitle}>{FOUND.title}</Text>
                  <Text style={sc.foundAuthor}>{FOUND.author}</Text>
                  <Text style={sc.foundMeta}>{FOUND.meta}</Text>
                </View>
              </View>
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actShelf]} onPress={() => setMode('shelf')} activeOpacity={0.85}>
                  <ShelfIcon color={WHITE} size={20} sw={1.9} />
                  <Text style={sc.actShelfText}>Add to Shelf</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sc.act, sc.actWish]} onPress={() => setMode('wishlist')} activeOpacity={0.85}>
                  <HeartIcon color={BROWN} size={20} />
                  <Text style={sc.actWishText}>Add to Wishlist</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={reset} activeOpacity={0.7}>
                <Text style={sc.again}>Not the right book? Scan again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={sc.done}>
              <Animated.View style={[sc.doneCheck, { transform: [{ scale: checkScale }] }]}>
                <CheckIcon color={WHITE} size={30} />
              </Animated.View>
              <Text style={sc.doneTitle}>{mode === 'shelf' ? 'Added to your Shelf' : 'Saved to your Wishlist'}</Text>
              <View style={sc.doneRow}>
                <Image source={COVER} style={sc.doneRowImg} resizeMode="cover" />
                <View style={sc.foundTxt}>
                  <Text style={sc.foundTitle}>{FOUND.title}</Text>
                  <Text style={sc.foundAuthor}>{FOUND.author}</Text>
                </View>
              </View>
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actWish]} onPress={reset} activeOpacity={0.85}>
                  <Text style={sc.actWishText}>Scan another</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[sc.act, sc.actSolid]}
                  onPress={() => router.navigate(mode === 'shelf' ? '/(tabs)/shelf' : '/(tabs)')}
                  activeOpacity={0.85}
                >
                  <Text style={sc.actSolidText}>{mode === 'shelf' ? 'View Shelf' : 'View Wishlist'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#100C09' },

  // ── Top bar
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12, zIndex: 4 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topBtnOn: { backgroundColor: AMBER },
  topTitle: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },

  // ── Viewfinder
  view: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scene: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  book: {
    width: 168, height: 252, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 7, borderBottomRightRadius: 7,
    transform: [{ perspective: 900 }, { rotateX: '7deg' }, { rotateY: '-9deg' }],
    shadowColor: '#000', shadowOffset: { width: 0, height: 40 }, shadowOpacity: 0.6, shadowRadius: 60,
  },

  // Reticle
  reticle: { position: 'absolute', width: 224, height: RETICLE_H, zIndex: 3 },
  corner: { position: 'absolute', width: 34, height: 34, opacity: 0.95 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#F0BC5A', shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },

  // Hint
  hint: {
    position: 'absolute', bottom: 26, zIndex: 4, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
  },
  hintText: { fontSize: 13, fontWeight: '700', color: WHITE },
  spinner: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(232,168,56,0.35)', borderTopColor: AMBER },

  // ── Controls
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 22, zIndex: 4 },
  mini: { alignItems: 'center', gap: 6, width: 80 },
  miniLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  gallery: { width: 26, height: 26, borderRadius: 7, borderWidth: 1.6, borderColor: 'rgba(255,255,255,0.55)', backgroundColor: '#5A4470' },
  shutter: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 20,
  },
  shutterIn: { width: 60, height: 60, borderRadius: 30, backgroundColor: WHITE },

  // ── Sheet
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6,
    backgroundColor: '#FAF8F3', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: -16 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 20,
  },
  tag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: '#E9F4EC', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  tagDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: GREEN },
  tagText: { fontSize: 12, fontWeight: '800', color: GREEN },

  found: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 16 },
  foundImg: { width: 72, height: 108, borderRadius: 5, shadowColor: '#5A3C23', shadowOffset: { width: 2, height: 6 }, shadowOpacity: 0.28, shadowRadius: 16 },
  foundTxt: { flex: 1, minWidth: 0 },
  foundTitle: { fontFamily: 'Georgia', fontSize: 19, fontWeight: '600', lineHeight: 23, color: INK },
  foundAuthor: { fontSize: 13.5, fontWeight: '700', color: BROWN, marginTop: 3 },
  foundMeta: { fontSize: 12, fontWeight: '600', color: MUTE, marginTop: 6 },

  actions: { flexDirection: 'row', gap: 11, marginTop: 22 },
  act: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 52, borderRadius: 15 },
  actShelf: { backgroundColor: AMBER, shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.34, shadowRadius: 20, elevation: 4 },
  actShelfText: { fontSize: 14.5, fontWeight: '800', color: WHITE },
  actWish: { backgroundColor: WHITE, borderWidth: 1.5, borderColor: 'rgba(139,94,60,0.22)' },
  actWishText: { fontSize: 14.5, fontWeight: '800', color: BROWN },
  actSolid: { backgroundColor: INK },
  actSolidText: { fontSize: 14.5, fontWeight: '800', color: WHITE },
  again: { textAlign: 'center', marginTop: 14, fontSize: 13, fontWeight: '700', color: MUTE },

  // ── Confirmation
  done: { alignItems: 'center' },
  doneCheck: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 6,
  },
  doneTitle: { fontFamily: 'Georgia', fontSize: 21, fontWeight: '600', marginTop: 14, color: INK },
  doneRow: {
    flexDirection: 'row', gap: 14, alignItems: 'center', alignSelf: 'stretch',
    backgroundColor: WHITE, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', borderRadius: 16, padding: 12, marginTop: 18,
  },
  doneRowImg: { width: 48, height: 72, borderRadius: 4, shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 3 }, shadowOpacity: 0.22, shadowRadius: 9 },
});
