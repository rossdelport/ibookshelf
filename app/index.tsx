import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/theme';

// Entry gate. The welcome UI itself lives at /welcome (an unambiguous route) so
// that logout/delete can navigate back to it from inside the tabs — bare "/"
// also matches the (tabs) index, so navigating to "/" from a tab just swaps
// tabs instead of leaving the app. This screen only decides where to send you.
export default function Index() {
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);

  if (initializing) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <Redirect href={session ? '/(tabs)' : '/welcome'} />;
}
