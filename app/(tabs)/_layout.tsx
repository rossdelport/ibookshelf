import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraIcon, HeartIcon, HomeIcon, ProfileIcon, ShelfIcon } from '../../components/icons';

// ── Design tokens ──────────────────────────────────────────────────────────
const AMBER = '#E8A838';
const MUTE  = '#A89A88';

type IconCmp = (p: { color: string; size?: number; sw?: number }) => React.ReactElement;

// Scan sits in the centre as the app's primary action. Community is parked
// (see roadmap) — file kept, just not shown in the tab bar.
const TABS: { name: string; label: string; Icon: IconCmp }[] = [
  { name: 'index',    label: 'Home',     Icon: HomeIcon },
  { name: 'shelf',    label: 'Shelf',    Icon: ShelfIcon },
  { name: 'scan',     label: 'Scan',     Icon: CameraIcon },
  { name: 'wishlist', label: 'Wishlist', Icon: HeartIcon },
  { name: 'profile',  label: 'Profile',  Icon: ProfileIcon },
];

// Frosted 5-tab bar (DESIGN.md §5 Tabbar) — dark variant on the camera screen
function FableTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const dark = state.routes[state.index]?.name === 'scan';
  const inactive = dark ? 'rgba(255,255,255,0.5)' : MUTE;

  return (
    <BlurView
      intensity={dark ? 24 : 28}
      tint={dark ? 'dark' : 'light'}
      style={[tb.bar, dark ? tb.barDark : tb.barLight, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={[tb.overlay, { backgroundColor: dark ? 'rgba(16,12,9,0.62)' : 'rgba(250,248,243,0.72)' }]} />
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const active = state.index === i;
        const color = active ? AMBER : inactive;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name);
        };

        // Scan = the app's primary action → a larger, raised amber button.
        if (route.name === 'scan') {
          return (
            <TouchableOpacity
              key={route.key}
              style={tb.scanItem}
              onPress={onPress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel="Scan a book"
            >
              <View style={[tb.scanBtn, { borderColor: dark ? '#100C09' : '#FAF8F3' }]}>
                <tab.Icon color="#fff" size={27} sw={2.2} />
              </View>
              <Text style={[tb.scanLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <tab.Icon color={color} size={24} sw={active ? 2.1 : 1.8} />
            <Text style={[tb.label, { color }, active && tb.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FableTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
      {/* Parked: keep the screen file but exclude it from the tab bar/navigator */}
      <Tabs.Screen name="community" options={{ href: null }} />
    </Tabs>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    // Let the raised centre Scan button poke above the bar without clipping.
    overflow: 'visible',
  },
  barLight: {
    borderTopColor: 'rgba(139,94,60,0.12)',
    // Blur shows through on iOS; the overlay tints it warm.
    ...Platform.select({ android: { backgroundColor: 'rgba(250,248,243,0.96)' } }),
  },
  barDark: {
    borderTopColor: 'rgba(255,255,255,0.10)',
    ...Platform.select({ android: { backgroundColor: 'rgba(16,12,9,0.96)' } }),
  },
  overlay: StyleSheet.absoluteFillObject,
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: -0.1 },
  labelActive: { fontWeight: '800' },

  // ── Centre Scan button (raised, larger — the app's hero action)
  scanItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  scanBtn: {
    width: 56, height: 56, borderRadius: 28, marginTop: -18,
    backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#E29A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  scanLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: -0.1, marginTop: 4 },
});
