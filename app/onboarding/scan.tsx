import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { lookupBookByIsbn } from '../../lib/bookLookup';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';
import type { Book, ReadingStatus } from '../../types/book';

const CAM_BG = '#1B1A18';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 7; // segments 0–7 filled (screen 09)

const STATUSES: { key: ReadingStatus; label: string }[] = [
  { key: 'want_to_read', label: 'Want to read' },
  { key: 'reading', label: 'Reading' },
  { key: 'read', label: 'Read' },
];

// 'scanning' → camera live · 'identifying' → fetching · 'found' · 'notfound'
type ScanState = 'scanning' | 'identifying' | 'found' | 'notfound';

// ── Sub-components ─────────────────────────────────────────────────────────

function Chevron() {
  return (
    <View style={sc.chevronWrap}>
      <View style={sc.chevronArm1} />
      <View style={sc.chevronArm2} />
    </View>
  );
}

/** Small check glyph from two rotated bars */
function Check({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0, bottom: size * 0.18, width: size * 0.42, height: 2, borderRadius: 1, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', left: size * 0.26, bottom: size * 0.18, width: size * 0.72, height: 2, borderRadius: 1, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { addToShelf } = useBookshelfStore();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState<ReadingStatus>('want_to_read');
  const [viewH, setViewH] = useState(0);

  const lock = useRef(false);
  const sweep = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  // Loop the scan line while waiting for a barcode
  useEffect(() => {
    if (scanState !== 'scanning') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scanState, sweep]);

  // Celebrate the reveal once a book is found.
  useEffect(() => {
    if (scanState !== 'found') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reveal.setValue(0);
    Animated.spring(reveal, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
  }, [scanState, reveal]);

  const handleBarcode = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (lock.current) return;
    lock.current = true;
    setScanState('identifying');
    const found = await lookupBookByIsbn(data);
    if (found) {
      setBook(found);
      setScanState('found');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setScanState('notfound');
    }
  }, []);

  const rescan = () => {
    lock.current = false;
    setBook(null);
    setStatus('want_to_read');
    setScanState('scanning');
  };

  const addAndContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (book) addToShelf(book, status); // onboarding = first book, no dup possible
    router.push('/onboarding/review');
  };

  const skip = () => router.push('/onboarding/review');

  const lineY = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(viewH - 32, 0)] });
  const revealStyle = {
    opacity: reveal,
    transform: [
      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
      { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  };

  const found = scanState === 'found' && book;

  return (
    <SafeAreaView style={sc.safe}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={sc.topbar}>
        <TouchableOpacity style={sc.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={sc.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[sc.seg, i <= CURRENT_STEP && sc.segActive]} />
          ))}
        </View>
      </View>

      {found ? (
        // ── Full-screen book reveal ──────────────────────────────
        <Animated.View style={[sc.foundBody, revealStyle]}>
          <Text style={sc.eyebrow}>YOUR FIRST BOOK</Text>

          {book!.coverUrl ? (
            <Image source={{ uri: book!.coverUrl }} style={sc.heroCover} resizeMode="cover" />
          ) : (
            <View style={[sc.heroCover, sc.heroFallback]}>
              <Text style={sc.heroFallbackTitle} numberOfLines={4}>{book!.title}</Text>
            </View>
          )}

          <View style={sc.matchChip}>
            <Check color={colors.success} size={11} />
            <Text style={sc.matchText}>Match found</Text>
          </View>

          <Text style={sc.foundTitle} numberOfLines={2}>{book!.title}</Text>
          <Text style={sc.foundAuthor} numberOfLines={1}>{book!.author}</Text>

          {/* Status picker */}
          <View style={sc.statusRow}>
            {STATUSES.map((s) => {
              const on = status === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[sc.statusPill, on && sc.statusPillOn]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStatus(s.key); }}
                  activeOpacity={0.85}
                >
                  <Text style={[sc.statusLabel, on && sc.statusLabelOn]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      ) : (
        <>
          {/* ── Head ─────────────────────────────────── */}
          <View style={sc.head}>
            <Text style={sc.title}>Grab the book closest to you right now.</Text>
            <Text style={sc.sub}>Point your camera at the barcode and we'll add it to your library.</Text>
          </View>

          {/* ── Body ─────────────────────────────────── */}
          <View style={sc.body}>
            <View style={sc.scanView} onLayout={(e) => setViewH(e.nativeEvent.layout.height)}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  active={scanState === 'scanning'}
                  barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
                  onBarcodeScanned={scanState === 'scanning' ? handleBarcode : undefined}
                />
              ) : (
                <View style={sc.permissionWrap}>
                  <Text style={sc.permissionText}>
                    {permission && !permission.canAskAgain
                      ? 'Camera access is off. Enable it in Settings to scan books.'
                      : 'We need your camera to scan book barcodes.'}
                  </Text>
                  {permission && !permission.granted && permission.canAskAgain && (
                    <TouchableOpacity style={sc.permBtn} onPress={requestPermission} activeOpacity={0.85}>
                      <Text style={sc.permBtnText}>Allow camera</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Corner brackets */}
              <View style={[sc.corner, sc.cornerTL]} />
              <View style={[sc.corner, sc.cornerTR]} />
              <View style={[sc.corner, sc.cornerBL]} />
              <View style={[sc.corner, sc.cornerBR]} />

              {scanState === 'scanning' && permission?.granted && (
                <Animated.View style={[sc.scanLine, { transform: [{ translateY: lineY }] }]} />
              )}

              {scanState === 'identifying' && (
                <View style={sc.identifying}>
                  <ActivityIndicator color={colors.accentText} />
                  <Text style={sc.identifyingText}>Identifying…</Text>
                </View>
              )}
            </View>

            {scanState === 'notfound' && (
              <View style={sc.notice}>
                <Text style={sc.noticeText}>
                  Hmm, we couldn't identify that one. Make sure the barcode is inside the frame and try again.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* ── Footer ───────────────────────────────────── */}
      <View style={sc.footer}>
        {found ? (
          <>
            <TouchableOpacity style={sc.cta} onPress={addAndContinue} activeOpacity={0.9}>
              <Text style={sc.ctaText}>Add to your shelf</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={rescan} activeOpacity={0.7}>
              <Text style={sc.tinyLink}>Re-scan</Text>
            </TouchableOpacity>
          </>
        ) : scanState === 'notfound' ? (
          <>
            <TouchableOpacity style={sc.cta} onPress={rescan} activeOpacity={0.9}>
              <Text style={sc.ctaText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={skip} activeOpacity={0.7}>
              <Text style={sc.tinyLink}>I'll add books later</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={skip} activeOpacity={0.7}>
            <Text style={sc.tinyLink}>I'll add books later</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  // ── Progress
  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  segActive: { backgroundColor: colors.accent },

  // ── Head
  head: { paddingHorizontal: 22, marginTop: 24 },
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginTop: 10 },

  // ── Scan body
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 22 },
  scanView: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sheet, overflow: 'hidden', backgroundColor: CAM_BG, alignItems: 'center', justifyContent: 'center' },

  permissionWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  permissionText: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
  permBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
  permBtnText: { color: colors.accentText, fontFamily: fonts.semibold, fontSize: 14.5 },

  corner: { position: 'absolute', width: 30, height: 30, borderColor: colors.accentText },
  cornerTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },

  scanLine: { position: 'absolute', top: 16, left: 16, right: 16, height: 2, backgroundColor: '#F3EFE9', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6 },

  identifying: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(20,18,16,0.5)' },
  identifyingText: { color: colors.accentText, fontFamily: fonts.semibold, fontSize: 14 },

  // ── Found / full-screen reveal
  foundBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { fontFamily: fonts.medium, ...ty.eyebrow, color: colors.ink3, textTransform: 'uppercase', marginBottom: 22 },
  heroCover: { width: 188, height: 282, borderRadius: 8, backgroundColor: colors.chip, shadowColor: '#2A2017', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 24, elevation: 10 },
  heroFallback: { alignItems: 'center', justifyContent: 'center', padding: 18 },
  heroFallbackTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink1, textAlign: 'center' },

  matchChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, backgroundColor: colors.successSoft, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  matchText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.success },

  foundTitle: { fontFamily: fonts.semibold, ...ty.titleSm, color: colors.ink1, textAlign: 'center', marginTop: 14 },
  foundAuthor: { fontFamily: fonts.serifItalic, fontSize: 17, color: colors.ink2, textAlign: 'center', marginTop: 4 },

  statusRow: { flexDirection: 'row', gap: 8, marginTop: 22 },
  statusPill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.line },
  statusPillOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink2 },
  statusLabelOn: { color: colors.accentText },

  // ── Notice
  notice: { marginTop: 16, padding: 16, borderRadius: radius.card, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.line },
  noticeText: { fontFamily: fonts.medium, ...ty.body, color: colors.ink2, textAlign: 'center' },

  // ── Footer
  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
  tinyLink: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.ink3, marginTop: 14 },
});
