import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CameraIcon, HeartIcon, HomeIcon, ProfileIcon, ShelfIcon } from '../../components/icons';
import { colors, fonts } from '../../constants/theme';

type IconCmp = (p: { color: string; size?: number; sw?: number }) => React.ReactElement;

// Scan sits in the centre as the app's primary action. Community is parked.
const TABS: { name: string; label: string; Icon: IconCmp }[] = [
  { name: 'index', label: 'Home', Icon: HomeIcon },
  { name: 'shelf', label: 'Shelf', Icon: ShelfIcon },
  { name: 'scan', label: 'Scan', Icon: CameraIcon },
  { name: 'wishlist', label: 'Wishlist', Icon: HeartIcon },
  { name: 'profile', label: 'Profile', Icon: ProfileIcon },
];

// Frosted 5-tab bar — dark variant on the camera screen.
function FableTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const dark = state.routes[state.index]?.name === 'scan';
  const active = dark ? colors.accentText : colors.accent;
  const inactive = dark ? 'rgba(255,255,255,0.5)' : colors.ink3;

  return (
    <BlurView
      intensity={dark ? 24 : 28}
      tint={dark ? 'dark' : 'light'}
      style={[tb.bar, dark ? tb.barDark : tb.barLight, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={[tb.overlay, { backgroundColor: dark ? 'rgba(16,14,12,0.62)' : 'rgba(250,248,244,0.72)' }]} />
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const isActive = state.index === i;
        const color = isActive ? active : inactive;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) {
            Haptics.selectionAsync();
            navigation.navigate(route.name);
          }
        };

        // Scan = the app's primary action → a larger, raised button.
        if (route.name === 'scan') {
          return (
            <TouchableOpacity key={route.key} style={tb.scanItem} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ selected: isActive }} accessibilityLabel="Scan a book">
              <View style={[tb.scanBtn, { borderColor: dark ? '#100C09' : colors.bg }]}>
                <tab.Icon color={colors.accentText} size={27} sw={2.2} />
              </View>
              <Text style={[tb.scanLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} style={tb.item} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: isActive }} accessibilityLabel={tab.label}>
            <tab.Icon color={color} size={24} sw={isActive ? 2.2 : 1.8} />
            <Text style={[tb.label, { color }, isActive && tb.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FableTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
      <Tabs.Screen name="community" options={{ href: null }} />
    </Tabs>
  );
}

const tb = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 10, paddingHorizontal: 8, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'visible' },
  barLight: { borderTopColor: colors.line, ...Platform.select({ android: { backgroundColor: 'rgba(250,248,244,0.96)' } }) },
  barDark: { borderTopColor: 'rgba(255,255,255,0.10)', ...Platform.select({ android: { backgroundColor: 'rgba(16,14,12,0.96)' } }) },
  overlay: StyleSheet.absoluteFillObject,
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 10.5, letterSpacing: -0.1 },
  labelActive: { fontFamily: fonts.semibold },

  // ── Centre Scan button (raised)
  scanItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  scanBtn: {
    width: 56, height: 56, borderRadius: 28, marginTop: -18,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3,
    shadowColor: '#1F2733', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  scanLabel: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: -0.1, marginTop: 4 },
});
