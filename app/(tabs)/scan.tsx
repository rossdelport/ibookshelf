import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { CheckIcon, CloseIcon, FlashIcon, HeartIcon, ShelfIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import { lookupBookByIsbn } from '../../lib/bookLookup';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';
import type { Book } from '../../types/book';

const WHITE = '#FFFFFF';
const CAM_BG = '#100E0C';
const RETICLE_H = 300;

type Mode = 'aim' | 'identifying' | 'result' | 'owned' | 'shelf' | 'wishlist' | 'notfound';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { addToShelf, getShelfEntry } = useBookshelfStore();
  const shelfDefs = useUserStore((s) => s.profile.shelves);
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<Mode>('aim');
  const [book, setBook] = useState<Book | null>(null);
  const [flash, setFlash] = useState(false);
  const [focused, setFocused] = useState(true);
  const [manualIsbn, setManualIsbn] = useState('');
  const [kb, setKb] = useState(0);

  const lock = useRef(false);
  const sweep = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(34)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const showSheet = mode === 'result' || mode === 'owned' || mode === 'shelf' || mode === 'wishlist' || mode === 'notfound';
  const added = mode === 'shelf' || mode === 'wishlist';
  const scanning = mode === 'aim';

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKb(e.endCoordinates?.height ?? 0));
    const h = Keyboard.addListener(hideEvt, () => setKb(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  useEffect(() => {
    if (mode !== 'aim' && mode !== 'identifying') return;
    const line = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(sweep, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const spinner = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }));
    line.start(); spinner.start();
    return () => { line.stop(); spinner.stop(); };
  }, [mode, sweep, spin]);

  useEffect(() => {
    if (showSheet) {
      sheetY.setValue(34);
      Animated.timing(sheetY, { toValue: 0, duration: 340, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
    }
  }, [showSheet, sheetY]);

  useEffect(() => {
    if (added) {
      checkScale.setValue(0);
      Animated.timing(checkScale, { toValue: 1, duration: 400, easing: Easing.bezier(0.22, 1.4, 0.4, 1), useNativeDriver: true }).start();
    }
  }, [added, checkScale]);

  const identify = useCallback(async (code: string) => {
    setMode('identifying');
    const found = await lookupBookByIsbn(code);
    if (!found) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMode('notfound');
      return;
    }
    setBook(found);
    const entry = getShelfEntry(found.id);
    const owned = !!entry && entry.status !== 'wishlist';
    Haptics.notificationAsync(owned ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    setMode(owned ? 'owned' : 'result');
  }, [getShelfEntry]);

  const handleBarcode = useCallback(({ data }: BarcodeScanningResult) => {
    if (lock.current) return;
    lock.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    identify(data);
  }, [identify]);

  const cleanIsbn = manualIsbn.replace(/[^0-9Xx]/g, '');
  const lookupManual = () => {
    if (cleanIsbn.length < 10) return;
    Keyboard.dismiss();
    lock.current = true;
    identify(cleanIsbn);
  };

  const reset = () => { lock.current = false; setBook(null); setManualIsbn(''); setMode('aim'); };
  const exit = () => { reset(); router.navigate('/(tabs)'); };

  const addToLibrary = (status: 'want_to_read' | 'wishlist') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (book) addToShelf(book, status);
    setMode(status === 'wishlist' ? 'wishlist' : 'shelf');
  };

  const ownedShelves = book ? getShelfEntry(book.id)?.shelves ?? [] : [];
  const ownedShelfLabel = ownedShelves.map((n) => {
    const def = shelfDefs.find((sh) => sh.name === n);
    return def ? `${def.emoji} ${def.name}` : n;
  }).join(', ');

  const lineY = sweep.interpolate({ inputRange: [0, 1], outputRange: [RETICLE_H * 0.04, RETICLE_H * 0.96] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={sc.root}>
      {focused && <StatusBar style="light" />}

      {/* ── Camera (live) ─────────────────────────────── */}
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
          active={scanning && focused}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'upc_a', 'ean8'] }}
          onBarcodeScanned={scanning ? handleBarcode : undefined}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, sc.permFill]}>
          <Text style={sc.permText}>
            {permission && !permission.canAskAgain ? 'Camera access is off. Enable it in Settings to scan books.' : 'iBookshelf needs your camera to scan book barcodes.'}
          </Text>
          {permission && !permission.granted && permission.canAskAgain && (
            <TouchableOpacity style={sc.permBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={sc.permBtnText}>Allow camera</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Vignette over the live feed */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="vig" cx="50%" cy="50%" rx="75%" ry="75%">
            <Stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.6" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#vig)" />
      </Svg>

      {/* ── Top bar ───────────────────────────────────── */}
      <View style={[sc.top, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={sc.topBtn} onPress={exit} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Cancel scan">
          <CloseIcon color={WHITE} />
        </TouchableOpacity>
        <Text style={sc.topTitle}>Scan a Book</Text>
        <TouchableOpacity style={[sc.topBtn, flash && sc.topBtnOn]} onPress={() => setFlash((f) => !f)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={flash ? 'Turn flash off' : 'Turn flash on'}>
          <FlashIcon color={flash ? colors.ink1 : WHITE} />
        </TouchableOpacity>
      </View>

      {/* ── "You own this" banner ─────────────────────── */}
      {mode === 'owned' && (
        <View style={[sc.ownedBanner, { top: insets.top + 70 }]} pointerEvents="none">
          <Text style={sc.ownedBannerEmoji}>📚</Text>
          <Text style={sc.ownedBannerText}>You own this book!</Text>
          <Text style={sc.ownedBannerSub}>No need to buy it again 🎉</Text>
        </View>
      )}

      {/* ── Reticle + hint ────────────────────────────── */}
      {!showSheet && (
        <View style={sc.center} pointerEvents="none">
          <View style={sc.reticle}>
            <View style={[sc.corner, sc.cornerTL]} />
            <View style={[sc.corner, sc.cornerTR]} />
            <View style={[sc.corner, sc.cornerBL]} />
            <View style={[sc.corner, sc.cornerBR]} />
            {(scanning || mode === 'identifying') && permission?.granted && (
              <Animated.View style={[sc.scanLine, { transform: [{ translateY: lineY }] }]} />
            )}
          </View>

          {scanning && permission?.granted && (
            <View style={sc.hint}><Text style={sc.hintText}>Point at the book's barcode</Text></View>
          )}
          {mode === 'identifying' && (
            <View style={sc.hint}>
              <Animated.View style={[sc.spinner, { transform: [{ rotate: spinDeg }] }]} />
              <Text style={sc.hintText}>Identifying…</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Result / confirmation sheet ───────────────── */}
      {showSheet && (
        <Animated.View style={[sc.sheet, { paddingBottom: insets.bottom + 16, marginBottom: kb, transform: [{ translateY: sheetY }] }]}>
          {mode === 'result' && book && (
            <>
              <View style={sc.tag}><View style={sc.tagDot} /><Text style={sc.tagText}>Match found</Text></View>
              <BookRow book={book} />
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actSolid]} onPress={() => addToLibrary('want_to_read')} activeOpacity={0.9}>
                  <ShelfIcon color={colors.accentText} size={20} sw={1.9} />
                  <Text style={sc.actSolidText}>Add to Shelf</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sc.act, sc.actGhost]} onPress={() => addToLibrary('wishlist')} activeOpacity={0.9}>
                  <HeartIcon color={colors.ink2} size={20} />
                  <Text style={sc.actGhostText}>Wishlist</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={reset} activeOpacity={0.7}>
                <Text style={sc.again}>Not the right book? Scan again</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'owned' && book && (
            <>
              <View style={[sc.tag, sc.tagOwned]}><Text style={[sc.tagText, sc.tagTextOwned]}>Already in your library</Text></View>
              <BookRow book={book} />
              <Text style={sc.ownedNote}>
                {ownedShelfLabel ? `You already own this — it's on your ${ownedShelfLabel} shelf. No need to buy it again. 🎉` : 'You already own this — no need to buy it again. 🎉'}
              </Text>
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actGhost]} onPress={reset} activeOpacity={0.9}>
                  <Text style={sc.actGhostText}>Scan again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sc.act, sc.actSolid]} onPress={() => router.navigate('/(tabs)/shelf')} activeOpacity={0.9}>
                  <Text style={sc.actSolidText}>View Shelf</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {mode === 'notfound' && (
            <View style={sc.notfound}>
              <Text style={sc.notfoundTitle}>Couldn't identify that book</Text>
              <Text style={sc.notfoundText}>Make sure the barcode is inside the frame and well lit — or type the ISBN printed under it.</Text>
              <View style={sc.isbnRow}>
                <TextInput style={sc.isbnInput} value={manualIsbn} onChangeText={setManualIsbn} placeholder="Enter ISBN" placeholderTextColor={colors.ink3} keyboardType="number-pad" returnKeyType="search" onSubmitEditing={lookupManual} maxLength={17} />
                <TouchableOpacity style={[sc.isbnBtn, cleanIsbn.length < 10 && sc.isbnBtnDisabled]} onPress={lookupManual} disabled={cleanIsbn.length < 10} activeOpacity={0.9}>
                  <Text style={[sc.isbnBtnText, cleanIsbn.length < 10 && sc.isbnBtnTextDisabled]}>Look up</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[sc.act, sc.actGhost, { alignSelf: 'stretch', marginTop: 12 }]} onPress={reset} activeOpacity={0.9}>
                <Text style={sc.actGhostText}>Scan again</Text>
              </TouchableOpacity>
            </View>
          )}

          {added && book && (
            <View style={sc.done}>
              <Animated.View style={[sc.doneCheck, { transform: [{ scale: checkScale }] }]}>
                <CheckIcon color={WHITE} size={30} />
              </Animated.View>
              <Text style={sc.doneTitle}>{mode === 'shelf' ? 'Added to your Shelf' : 'Saved to your Wishlist'}</Text>
              <View style={sc.doneRow}>
                <BookCover book={book} small />
                <View style={sc.foundTxt}>
                  <Text style={sc.foundTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={sc.foundAuthor} numberOfLines={1}>{book.author}</Text>
                </View>
              </View>
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actGhost]} onPress={reset} activeOpacity={0.9}>
                  <Text style={sc.actGhostText}>Scan another</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sc.act, sc.actSolid]} onPress={() => router.navigate(mode === 'shelf' ? '/(tabs)/shelf' : '/(tabs)/wishlist')} activeOpacity={0.9}>
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

function BookCover({ book, small }: { book: Book; small?: boolean }) {
  const style = small ? sc.doneRowImg : sc.foundImg;
  if (book.coverUrl) return <Image source={{ uri: book.coverUrl }} style={style} contentFit="cover" transition={200} cachePolicy="memory-disk" />;
  return <View style={[style, sc.coverFallback]}><Text style={{ fontSize: small ? 20 : 30 }}>📖</Text></View>;
}

function BookRow({ book }: { book: Book }) {
  const meta = [book.publishedYear, book.pageCount ? `${book.pageCount} pp` : null].filter(Boolean).join(' · ');
  return (
    <View style={sc.found}>
      <BookCover book={book} />
      <View style={sc.foundTxt}>
        <Text style={sc.foundTitle} numberOfLines={3}>{book.title}</Text>
        <Text style={sc.foundAuthor} numberOfLines={1}>{book.author}</Text>
        {!!meta && <Text style={sc.foundMeta}>{meta}</Text>}
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: CAM_BG },

  permFill: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 18, backgroundColor: CAM_BG },
  permText: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, ...ty.body, textAlign: 'center' },
  permBtn: { backgroundColor: colors.card, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 26 },
  permBtnText: { color: colors.ink1, fontFamily: fonts.semibold, ...ty.label },

  // ── Top bar
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12, zIndex: 4 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  topBtnOn: { backgroundColor: WHITE },
  topTitle: { fontFamily: fonts.semibold, fontSize: 16, color: WHITE },

  // ── Owned banner
  ownedBanner: { position: 'absolute', left: 22, right: 22, alignItems: 'center', zIndex: 7, backgroundColor: colors.bg, borderRadius: radius.sheet, paddingVertical: 20, paddingHorizontal: 22, borderWidth: 1.5, borderColor: colors.accent, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 22, elevation: 10 },
  ownedBannerEmoji: { fontSize: 34 },
  ownedBannerText: { fontFamily: fonts.semibold, ...ty.titleSm, color: colors.ink1, marginTop: 8 },
  ownedBannerSub: { fontFamily: fonts.medium, ...ty.body, color: colors.ink2, marginTop: 4 },

  // ── Reticle
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  reticle: { width: 224, height: RETICLE_H, zIndex: 3 },
  corner: { position: 'absolute', width: 34, height: 34, opacity: 0.95, borderColor: WHITE },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: WHITE, shadowColor: WHITE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 },

  hint: { position: 'absolute', bottom: 120, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  hintText: { fontFamily: fonts.medium, ...ty.bodySm, color: WHITE },
  spinner: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', borderTopColor: WHITE },

  // ── Sheet
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, backgroundColor: colors.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 22, paddingTop: 22, shadowColor: '#000', shadowOffset: { width: 0, height: -16 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: colors.successSoft, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  tagDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success },
  tagText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.success },
  tagOwned: { backgroundColor: colors.dangerSoft },
  tagTextOwned: { color: colors.danger },

  found: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 16 },
  foundImg: { width: 72, height: 108, borderRadius: 6, backgroundColor: colors.chip },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  foundTxt: { flex: 1, minWidth: 0 },
  foundTitle: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1 },
  foundAuthor: { fontFamily: fonts.serifItalic, fontSize: 14, color: colors.ink2, marginTop: 3 },
  foundMeta: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, marginTop: 6 },

  ownedNote: { fontFamily: fonts.medium, ...ty.body, color: colors.ink2, marginTop: 16 },

  actions: { flexDirection: 'row', gap: 11, marginTop: 22 },
  act: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 52, borderRadius: radius.button },
  actSolid: { backgroundColor: colors.accent, ...shadow.button },
  actSolidText: { fontFamily: fonts.semibold, ...ty.label, color: colors.accentText },
  actGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  actGhostText: { fontFamily: fonts.semibold, ...ty.label, color: colors.ink1 },
  again: { textAlign: 'center', marginTop: 14, fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink3 },

  // ── Couldn't identify
  notfound: { alignItems: 'center' },
  notfoundTitle: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1, marginTop: 4 },
  notfoundText: { fontFamily: fonts.regular, ...ty.body, color: colors.ink3, textAlign: 'center', marginTop: 8 },
  isbnRow: { flexDirection: 'row', alignSelf: 'stretch', gap: 10, marginTop: 18 },
  isbnInput: { flex: 1, backgroundColor: colors.card, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 13, fontFamily: fonts.medium, fontSize: 15.5, color: colors.ink1, borderWidth: 1, borderColor: colors.line },
  isbnBtn: { backgroundColor: colors.accent, borderRadius: radius.card, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  isbnBtnDisabled: { backgroundColor: colors.chip },
  isbnBtnText: { fontFamily: fonts.semibold, ...ty.label, color: colors.accentText },
  isbnBtnTextDisabled: { color: colors.ink3 },

  // ── Confirmation
  done: { alignItems: 'center' },
  doneCheck: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: colors.success, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 6 },
  doneTitle: { fontFamily: fonts.semibold, ...ty.section, marginTop: 14, color: colors.ink1 },
  doneRow: { flexDirection: 'row', gap: 14, alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, padding: 12, marginTop: 18 },
  doneRowImg: { width: 48, height: 72, borderRadius: 5, backgroundColor: colors.chip },
});
