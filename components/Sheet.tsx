import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, type as ty, shadow } from '../constants/theme';

// Reusable bottom-sheet modal: dim backdrop (tap to dismiss), slide-up card with
// a grab handle, title + Cancel, scrollable body, and an optional Save button.
export function Sheet({
  visible,
  onClose,
  title,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 280, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, anim]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,18,16,0.45)', opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[s.card, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={s.cancel}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: onSave ? 12 : 0 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          {onSave && (
            <Pressable style={[s.save, saveDisabled && s.saveDisabled]} onPress={onSave} disabled={saveDisabled}>
              <Text style={[s.saveText, saveDisabled && s.saveTextDisabled]}>{saveLabel}</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  card: { backgroundColor: colors.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 22, paddingTop: 10, maxHeight: '88%', ...shadow.sheet },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999, backgroundColor: colors.lineStrong, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: fonts.semibold, ...ty.section, color: colors.ink1 },
  cancel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink3 },
  save: { backgroundColor: colors.accent, borderRadius: radius.button, paddingVertical: 16, alignItems: 'center', marginTop: 14, ...shadow.button },
  saveText: { fontFamily: fonts.semibold, ...ty.label, color: colors.accentText },
  saveDisabled: { backgroundColor: colors.chip, shadowOpacity: 0, elevation: 0 },
  saveTextDisabled: { color: colors.ink3 },
});
