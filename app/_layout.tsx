import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/unread" />
        <Stack.Screen name="onboarding/mirror" />
        <Stack.Screen name="onboarding/genres" />
        <Stack.Screen name="onboarding/avatar" />
        <Stack.Screen name="onboarding/soul" />
        <Stack.Screen
          name="onboarding/soul-detail"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="book/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}
