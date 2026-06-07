import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSyncStore } from '../store/syncStore';
import { forceSync } from '../lib/sync';

// Small, trust-building indicator. Tap to force a "back up now".
export function SyncStatus() {
  const status = useSyncStore((s) => s.status);
  const pending = useSyncStore((s) => s.pending);

  let label = 'Synced';
  let color = '#5BA66E';
  let spinner = false;

  if (status === 'syncing') {
    label = 'Syncing…';
    color = '#C0851E';
    spinner = true;
  } else if (status === 'offline') {
    label = pending > 0 ? `Offline · ${pending}` : 'Offline';
    color = '#A89A88';
  } else if (status === 'error') {
    label = 'Tap to retry';
    color = '#E8A838';
  }

  return (
    <TouchableOpacity style={st.pill} onPress={forceSync} activeOpacity={0.7}>
      {spinner ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <View style={[st.dot, { backgroundColor: color }]} />
      )}
      <Text style={[st.text, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(139,94,60,0.14)',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  text: { fontSize: 11.5, fontWeight: '800' },
});
