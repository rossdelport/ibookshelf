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
        <Stack.Screen name="onboarding/shelf" />
        <Stack.Screen name="onboarding/signup" />
        <Stack.Screen name="onboarding/scan" />
        <Stack.Screen name="onboarding/review" />
        <Stack.Screen name="onboarding/circle" />
        <Stack.Screen name="onboarding/paywall" />
        <Stack.Screen
          name="onboarding/soul-detail"
          options={{
            presentation: 'transparentModal',
            // No native transition — the screen drives its own rotate/scale + scrim fade
            animation: 'none',
            headerShown: false,
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
      </Stack>
    </>
  );
}
