import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/userStore';
import { AvatarBuilder, DEFAULT_DRAFT, type AvatarDraft } from '../../components/AvatarBuilder';
import { colors, fonts, radius, type as ty, shadow } from '../../constants/theme';

const TOTAL_STEPS = 9;
const CURRENT_STEP = 3; // 4 segments filled (screen 05)

function Chevron() {
  return (
    <View style={av.chevronWrap}>
      <View style={av.chevronArm1} />
      <View style={av.chevronArm2} />
    </View>
  );
}

export default function AvatarScreen() {
  const { setAvatar, setUsername, profile } = useUserStore();

  const [name, setName] = useState(profile.username ?? '');
  const [draft, setDraft] = useState<AvatarDraft>(profile.avatar ?? DEFAULT_DRAFT);

  const nameField = (
    <View style={av.usernameRow}>
      <TextInput
        style={av.username}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.ink3}
        maxLength={30}
        returnKeyType="done"
      />
    </View>
  );

  return (
    <SafeAreaView style={av.safe}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={av.topbar}>
        <TouchableOpacity style={av.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Chevron />
        </TouchableOpacity>
        <View style={av.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[av.seg, i <= CURRENT_STEP && av.segActive]} />
          ))}
        </View>
      </View>

      <ScrollView style={av.scroll} contentContainerStyle={av.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={av.title}>Let's make this yours.</Text>
        <Text style={av.sub}>Create your reader profile.</Text>

        <AvatarBuilder value={draft} onChange={setDraft} belowPreview={nameField} />
      </ScrollView>

      {/* ── Footer CTA ───────────────────────────────── */}
      <View style={av.footer}>
        <TouchableOpacity
          style={av.cta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setUsername(name);
            setAvatar(draft);
            router.push('/onboarding/soul');
          }}
          activeOpacity={0.9}
        >
          <Text style={av.ctaText}>Looks good</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const av = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 16 },

  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chevronWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center', marginRight: -2 },
  chevronArm1: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, top: 2.5, left: 2, transform: [{ rotate: '-45deg' }] },
  chevronArm2: { position: 'absolute', width: 7, height: 2, borderRadius: 1, backgroundColor: colors.ink1, bottom: 2.5, left: 2, transform: [{ rotate: '45deg' }] },

  progressRow: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.line },
  segActive: { backgroundColor: colors.accent },

  title: { fontFamily: fonts.light, ...ty.hero, color: colors.ink1, marginTop: 22 },
  sub: { fontFamily: fonts.regular, ...ty.bodyLg, color: colors.ink3, marginTop: 8 },

  usernameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  username: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink1, textAlign: 'center', minWidth: 140, paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },

  footer: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 8 },
  cta: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 18, alignItems: 'center', ...shadow.button },
  ctaText: { color: colors.accentText, fontFamily: fonts.semibold, ...ty.label },
});
