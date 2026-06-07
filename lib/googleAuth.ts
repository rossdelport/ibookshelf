import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Lets the in-app browser dismiss itself when the auth redirect returns.
WebBrowser.maybeCompleteAuthSession();

export interface OAuthResult {
  ok: boolean;
  error?: string; // undefined when the user simply cancelled
}

// Google sign-in via Supabase's hosted OAuth flow:
// app → Google → Supabase callback → back into the app, then set the session.
export async function signInWithGoogle(): Promise<OAuthResult> {
  // Standalone / dev-build → fable://auth-callback ; Expo Go → exp://…/--/auth-callback
  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: 'Could not start Google sign-in.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { ok: false }; // dismissed / cancelled — not an error to surface
  }

  // PKCE flow returns ?code=… ; implicit flow returns #access_token=…&refresh_token=…
  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    return exErr ? { ok: false, error: exErr.message } : { ok: true };
  }

  const fragment = result.url.includes('#') ? result.url.split('#')[1] : '';
  const fp = new URLSearchParams(fragment);
  const access_token = fp.get('access_token');
  const refresh_token = fp.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: ssErr } = await supabase.auth.setSession({ access_token, refresh_token });
    return ssErr ? { ok: false, error: ssErr.message } : { ok: true };
  }

  const errDesc = typeof queryParams?.error_description === 'string' ? queryParams.error_description : undefined;
  return { ok: false, error: errDesc ?? 'No session returned from Google.' };
}
