import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { CheckIcon, CloseIcon, FlashIcon, HeartIcon, ShelfIcon } from '../../components/icons';
import { useBookshelfStore } from '../../store/bookshelfStore';
import { useUserStore } from '../../store/userStore';
import { lookupBookByIsbn } from '../../lib/bookLookup';
import type { Book } from '../../types/book';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const AMBER = '#E8A838';
const WHITE = '#FFFFFF';
const GREEN = '#5BA66E';
const RED   = '#E0506B';

const RETICLE_H = 300;

// 'aim' → camera live, scanning for a barcode
// 'identifying' → barcode caught, looking it up
// 'result' → new book identified, offer to add
// 'owned' → already in the library (the duplicate-check payoff)
// 'shelf' / 'wishlist' → confirmation after adding
// 'notfound' → barcode read but no match
type Mode = 'aim' | 'identifying' | 'result' | 'owned' | 'shelf' | 'wishlist' | 'notfound';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { addToShelf, getShelfEntry } = useBookshelfStore();
  const shelfDefs = useUserStore((s) => s.profile.shelves);
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<Mode>('aim');
  const [book, setBook] = useState<Book | null>(null);
  const [flash, setFlash] = useState(false);

  const lock = useRef(false);
  const sweep = useRef(new Animated.Value(0)).current;
  const spin  = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(34)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const showSheet = mode === 'result' || mode === 'owned' || mode === 'shelf' || mode === 'wishlist' || mode === 'notfound';
  const added = mode === 'shelf' || mode === 'wishlist';
  const scanning = mode === 'aim';

  // Ask for camera access on first mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  // Scan line + spinner loops while actively aiming / identifying
  useEffect(() => {
    if (mode !== 'aim' && mode !== 'identifying') return;
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

  const handleBarcode = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (lock.current) return;
    lock.current = true;
    setMode('identifying');
    const found = await lookupBookByIsbn(data);
    if (!found) { setMode('notfound'); return; }
    setBook(found);
    // Duplicate check — owned means a shelf entry that isn't merely a wishlist item.
    const entry = getShelfEntry(found.id);
    setMode(entry && entry.status !== 'wishlist' ? 'owned' : 'result');
  }, [getShelfEntry]);

  const reset = () => { lock.current = false; setBook(null); setMode('aim'); };

  const addToLibrary = (status: 'want_to_read' | 'wishlist') => {
    if (book) addToShelf(book, status);
    setMode(status === 'wishlist' ? 'wishlist' : 'shelf');
  };

  // Which custom shelf(es) an already-owned book is filed on (e.g. "Mum & Dad").
  const ownedShelves = book ? getShelfEntry(book.id)?.shelves ?? [] : [];
  const ownedShelfLabel = ownedShelves
    .map((n) => {
      const def = shelfDefs.find((sh) => sh.name === n);
      return def ? `${def.emoji} ${def.name}` : n;
    })
    .join(', ');

  const lineY = sweep.interpolate({ inputRange: [0, 1], outputRange: [RETICLE_H * 0.04, RETICLE_H * 0.96] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const cornerColor = mode === 'identifying' ? AMBER : WHITE;

  return (
    <View style={sc.root}>
      {/* ── Camera (live) ─────────────────────────────── */}
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
          // Camera runs only while aiming; powers down after a scan, back on for "Scan again".
          active={scanning}
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={scanning ? handleBarcode : undefined}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, sc.permFill]}>
          <Text style={sc.permText}>
            {permission && !permission.canAskAgain
              ? 'Camera access is off. Enable it in Settings to scan books.'
              : 'iBookshelf needs your camera to scan book barcodes.'}
          </Text>
          {permission && !permission.granted && permission.canAskAgain && (
            <TouchableOpacity style={sc.permBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={sc.permBtnText}>Allow camera</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Amber glow + vignette over the live feed */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="46%" rx="60%" ry="44%">
            <Stop offset="0" stopColor={AMBER} stopOpacity="0.10" />
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

      {/* ── Top bar ───────────────────────────────────── */}
      <View style={[sc.top, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={sc.topBtn} onPress={reset} activeOpacity={0.7}><CloseIcon color={WHITE} /></TouchableOpacity>
        <Text style={sc.topTitle}>Scan a Book</Text>
        <TouchableOpacity style={[sc.topBtn, flash && sc.topBtnOn]} onPress={() => setFlash((f) => !f)} activeOpacity={0.7}>
          <FlashIcon color={flash ? INK : WHITE} />
        </TouchableOpacity>
      </View>

      {/* ── Reticle + hint ────────────────────────────── */}
      {!showSheet && (
        <View style={sc.center} pointerEvents="none">
          <View style={sc.reticle}>
            <View style={[sc.corner, sc.cornerTL, { borderColor: cornerColor }]} />
            <View style={[sc.corner, sc.cornerTR, { borderColor: cornerColor }]} />
            <View style={[sc.corner, sc.cornerBL, { borderColor: cornerColor }]} />
            <View style={[sc.corner, sc.cornerBR, { borderColor: cornerColor }]} />
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
              <Text style={[sc.hintText, { color: '#FBE6BE' }]}>Identifying…</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Result / confirmation sheet ───────────────── */}
      {showSheet && (
        <Animated.View style={[sc.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: sheetY }] }]}>
          {/* New book found */}
          {mode === 'result' && book && (
            <>
              <View style={sc.tag}><View style={sc.tagDot} /><Text style={sc.tagText}>Match found</Text></View>
              <BookRow book={book} large />
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actShelf]} onPress={() => addToLibrary('want_to_read')} activeOpacity={0.85}>
                  <ShelfIcon color={WHITE} size={20} sw={1.9} />
                  <Text style={sc.actShelfText}>Add to Shelf</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sc.act, sc.actWish]} onPress={() => addToLibrary('wishlist')} activeOpacity={0.85}>
                  <HeartIcon color={BROWN} size={20} />
                  <Text style={sc.actWishText}>Add to Wishlist</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={reset} activeOpacity={0.7}>
                <Text style={sc.again}>Not the right book? Scan again</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Already owned — the duplicate-check payoff */}
          {mode === 'owned' && book && (
            <>
              <View style={[sc.tag, sc.tagOwned]}><Text style={[sc.tagText, sc.tagTextOwned]}>Already in your library</Text></View>
              <BookRow book={book} large />
              <Text style={sc.ownedNote}>
                {ownedShelfLabel
                  ? `You already own this — it's on your ${ownedShelfLabel} shelf. No need to buy it again. 🎉`
                  : 'You already own this — no need to buy it again. 🎉'}
              </Text>
              <View style={sc.actions}>
                <TouchableOpacity style={[sc.act, sc.actWish]} onPress={reset} activeOpacity={0.85}>
                  <Text style={sc.actWishText}>Scan again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sc.act, sc.actSolid]} onPress={() => router.navigate('/(tabs)/shelf')} activeOpacity={0.85}>
                  <Text style={sc.actSolidText}>View Shelf</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Couldn't identify */}
          {mode === 'notfound' && (
            <View style={sc.notfound}>
              <Text style={sc.notfoundTitle}>Couldn't identify that book</Text>
              <Text style={sc.notfoundText}>Make sure the barcode is inside the frame and well lit, then try again.</Text>
              <TouchableOpacity style={[sc.act, sc.actShelf, { alignSelf: 'stretch', marginTop: 18 }]} onPress={reset} activeOpacity={0.85}>
                <Text style={sc.actShelfText}>Scan again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Added confirmation */}
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

// ── Book cover image with emoji fallback ───────────────────────────────────
function BookCover({ book, small, large }: { book: Book; small?: boolean; large?: boolean }) {
  const style = small ? sc.doneRowImg : large ? sc.foundImg : sc.foundImg;
  if (book.coverUrl) {
    return <Image source={{ uri: book.coverUrl }} style={style} resizeMode="cover" />;
  }
  return (
    <View style={[style, sc.coverFallback]}>
      <Text style={{ fontSize: small ? 20 : 30 }}>📖</Text>
    </View>
  );
}

// ── Found book row (cover + title + author + meta) ─────────────────────────
function BookRow({ book }: { book: Book; large?: boolean }) {
  const meta = [book.publishedYear, book.pageCount ? `${book.pageCount} pp` : null].filter(Boolean).join(' · ');
  return (
    <View style={sc.found}>
      <BookCover book={book} large />
      <View style={sc.foundTxt}>
        <Text style={sc.foundTitle} numberOfLines={3}>{book.title}</Text>
        <Text style={sc.foundAuthor} numberOfLines={1}>{book.author}</Text>
        {!!meta && <Text style={sc.foundMeta}>{meta}</Text>}
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#100C09' },

  // ── Permission fallback
  permFill: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 18, backgroundColor: '#100C09' },
  permText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: AMBER, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 26 },
  permBtnText: { color: WHITE, fontSize: 15, fontWeight: '800' },

  // ── Top bar
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12, zIndex: 4 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  topBtnOn: { backgroundColor: AMBER },
  topTitle: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },

  // ── Reticle
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  reticle: { width: 224, height: RETICLE_H, zIndex: 3 },
  corner: { position: 'absolute', width: 34, height: 34, opacity: 0.95 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#F0BC5A', shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },

  // Hint
  hint: {
    position: 'absolute', bottom: 120, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
  },
  hintText: { fontSize: 13, fontWeight: '700', color: WHITE },
  spinner: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(232,168,56,0.35)', borderTopColor: AMBER },

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
  tagOwned: { backgroundColor: '#FBE4E8' },
  tagTextOwned: { color: RED },

  found: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 16 },
  foundImg: { width: 72, height: 108, borderRadius: 5, backgroundColor: '#F6EFE2', shadowColor: '#5A3C23', shadowOffset: { width: 2, height: 6 }, shadowOpacity: 0.28, shadowRadius: 16 },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  foundTxt: { flex: 1, minWidth: 0 },
  foundTitle: { fontFamily: 'Georgia', fontSize: 19, fontWeight: '600', lineHeight: 23, color: INK },
  foundAuthor: { fontSize: 13.5, fontWeight: '700', color: BROWN, marginTop: 3 },
  foundMeta: { fontSize: 12, fontWeight: '600', color: MUTE, marginTop: 6 },

  ownedNote: { fontSize: 13.5, fontWeight: '600', color: '#8a6a32', lineHeight: 19, marginTop: 16 },

  actions: { flexDirection: 'row', gap: 11, marginTop: 22 },
  act: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 52, borderRadius: 15 },
  actShelf: { backgroundColor: AMBER, shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.34, shadowRadius: 20, elevation: 4 },
  actShelfText: { fontSize: 14.5, fontWeight: '800', color: WHITE },
  actWish: { backgroundColor: WHITE, borderWidth: 1.5, borderColor: 'rgba(139,94,60,0.22)' },
  actWishText: { fontSize: 14.5, fontWeight: '800', color: BROWN },
  actSolid: { backgroundColor: INK },
  actSolidText: { fontSize: 14.5, fontWeight: '800', color: WHITE },
  again: { textAlign: 'center', marginTop: 14, fontSize: 13, fontWeight: '700', color: MUTE },

  // ── Couldn't identify
  notfound: { alignItems: 'center' },
  notfoundTitle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', color: INK, marginTop: 4 },
  notfoundText: { fontSize: 13.5, fontWeight: '600', color: MUTE, textAlign: 'center', lineHeight: 19, marginTop: 8 },

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
  doneRowImg: { width: 48, height: 72, borderRadius: 4, backgroundColor: '#F6EFE2', shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 3 }, shadowOpacity: 0.22, shadowRadius: 9 },
});
