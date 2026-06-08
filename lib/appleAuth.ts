import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';
import { useUserStore } from '../store/userStore';

// Native Sign in with Apple → Supabase. Required by App Store Guideline 4.8
// because the app also offers Google sign-in. Only available on iOS 13+.

export interface OAuthResult {
  ok: boolean;
  error?: string; // undefined when the user simply cancelled
}

export async function isAppleAuthAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

export async function signInWithApple(): Promise<OAuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { ok: false, error: 'No identity token returned from Apple.' };

    // Apple only sends the name on the very first sign-in — capture it before
    // we sign in so handleSignedIn's merge keeps it (remote has none yet).
    const given = credential.fullName?.givenName?.trim();
    if (given && !useUserStore.getState().profile.username) {
      useUserStore.getState().setUsername(given);
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    // User tapped Cancel on the native sheet — not an error to surface.
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return { ok: false };
    return { ok: false, error: (e as Error)?.message ?? 'Apple sign-in failed.' };
  }
}
