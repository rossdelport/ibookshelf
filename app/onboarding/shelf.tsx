import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/userStore';
import { ANIMALS } from '../../constants/animals';
import { AvatarFace } from '../../components/AvatarFace';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 5;

const DEFAULT_AVATAR = { skin: '#E8A87C', hairStyle: 1, hairColor: '#5C3317', shirtColor: '#232A33' };
const AVATAR_SIZE = 130;

export default function ShelfScreen() {
  const { profile } = useUserStore();
  const soulAnimal = ANIMALS.find((a) => a.name === profile.soulAnimal);
  const avatar = profile.avatar ?? DEFAULT_AVATAR;

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
        <View>
          <Text style={sh.title}>Your shelf is ready.</Text>
          <Text style={sh.sub}>Now let's fill it.</Text>
        </View>

        <View style={sh.pairRow}>
          <View style={sh.unit}>
            <View style={sh.avatarRing}>
              <AvatarFace skin={avatar.skin} hairStyle={avatar.hairStyle} hairColor={avatar.hairColor} shirtColor={avatar.shirtColor} size={AVATAR_SIZE} />
            </View>
            <Text style={sh.unitLabel}>You</Text>
          </View>

          <View style={sh.unit}>
            <View style={sh.soulCircle}><Text style={sh.soulEmoji}>{soulAnimal?.emoji ?? '📖'}</Text></View>
            <Text style={sh.unitLabel}>{soulAnimal?.name ?? 'Your soul'}</Text>
          </View>
        </View>

        <Text style={sh.caption}>Your reader, your soul. Customise it anytime.</Text>
      </View>

      <View style={sh.footer}>
        <TouchableOpacity style={sh.cta} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/onboarding/signup'); }} activeOpacity={0.9}>
          <Text style={sh.ctaText}>Let's go</Text>
        </TouchableOpacity>
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

  body: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 36 },
  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, textAlign: 'center', marginTop: 8 },

  pairRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 24 },
  unit: { alignItems: 'center', gap: 12 },
  unitLabel: { fontFamily: fonts.medium, ...ty.bodySm, color: colors.ink2 },
  avatarRing: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: colors.card, overflow: 'hidden', backgroundColor: colors.chip, ...shadow.card },
  soulCircle: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: colors.chip, borderWidth: 3, borderColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  soulEmoji: { fontSize: 70 },

  caption: { fontFamily: fonts.medium, ...ty.caption, color: colors.ink3, textAlign: 'center' },

  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
