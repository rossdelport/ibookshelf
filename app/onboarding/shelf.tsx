import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/userStore';
import { ANIMALS } from '../../constants/animals';
import { AvatarFace } from '../../components/AvatarFace';
import { Breathing, FadeIn } from '../../components/anim';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 5;

const DEFAULT_AVATAR = { skin: '#E8A87C', hairStyle: 1, hairColor: '#5C3317', shirtColor: '#232A33' };
const AVATAR_SIZE = 146;

// Rotating "setting up" status lines (one every 2s). After all 3 show, the
// Let's go button appears.
const PHRASES = ['Finding your books…', 'Building your shelves…', 'Dusting off the spines…'];

export default function ShelfScreen() {
  const { profile } = useUserStore();
  const soulAnimal = ANIMALS.find((a) => a.name === profile.soulAnimal);
  const avatar = profile.avatar ?? DEFAULT_AVATAR;

  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      if (i < PHRASES.length) setIdx(i);
      else { clearInterval(t); setReady(true); }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={sh.safe}>
      <View style={sh.topbar}>
        <TouchableOpacity style={sh.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={sh.chevronWrap}>
            <View style={sh.chevronArm1} />
            <View style={sh.chevronArm2} />
          </View>
        </TouchableOpacity>
        <View style={sh.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[sh.seg, i <= CURRENT_STEP && sh.segActive]} />
          ))}
        </View>
      </View>

      <View style={sh.body}>
        <FadeIn>
          <Text style={sh.title}>We're getting your iBookshelf set up</Text>
          <View style={sh.subWrap}>
            <FadeIn key={ready ? 'ready' : idx} from={6} duration={340}>
              <Text style={sh.sub}>{ready ? 'Ready when you are.' : PHRASES[idx]}</Text>
            </FadeIn>
          </View>
        </FadeIn>

        <Breathing amplitude={7} style={sh.pairRow}>
          <View style={sh.avatarRing}>
            <AvatarFace skin={avatar.skin} hairStyle={avatar.hairStyle} hairColor={avatar.hairColor} shirtColor={avatar.shirtColor} size={AVATAR_SIZE} />
          </View>
          <View style={sh.soulCircle}><Text style={sh.soulEmoji}>{soulAnimal?.emoji ?? '📖'}</Text></View>
        </Breathing>
      </View>

      <View style={sh.footer}>
        {ready && (
          <FadeIn from={12}>
            <TouchableOpacity style={sh.cta} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/onboarding/signup'); }} activeOpacity={0.9}>
              <Text style={sh.ctaText}>Let's go</Text>
            </TouchableOpacity>
          </FadeIn>
        )}
      </View>
    </SafeAreaView>
  );
}

const sh = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  segActive: { backgroundColor: colors.accent },

  body: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 48 },
  title: { fontFamily: fonts.light, ...ty.title, color: colors.ink1, textAlign: 'center' },
  subWrap: { alignItems: 'center', marginTop: 12, minHeight: 26 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, textAlign: 'center' },

  pairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 },
  avatarRing: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: colors.card, overflow: 'hidden', backgroundColor: colors.chip, ...shadow.card },
  soulCircle: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: colors.chip, borderWidth: 3, borderColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  soulEmoji: { fontSize: 80 },

  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8, minHeight: 74, justifyContent: 'flex-end' },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
