import { StyleSheet, Text, View } from 'react-native';

// Placeholder — Profile tab. Built next from the Claude Design screens.
export default function ProfileScreen() {
  return (
    <View style={s.screen}>
      <Text style={s.label}>Profile</Text>
      <Text style={s.sub}>Coming next</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F3', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontSize: 24, fontWeight: '800', color: '#332C24', letterSpacing: -0.4 },
  sub: { fontSize: 14, fontWeight: '600', color: '#A89A88' },
});
