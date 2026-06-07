import { File } from 'expo-file-system';
import { supabase } from './supabase';

// Cross-device persistence for user-photographed book covers. A picked photo is
// a local `file://` uri that only exists on this device; we upload it to the
// public `book-covers` bucket and store the resulting public URL as the book's
// coverUrl, so it survives reinstall and shows on other devices via sync.

const BUCKET = 'book-covers';

// Local book ids can be isbns, `manual_<ts>`, `gb_<volumeId>` etc. Keep the
// storage path safe.
function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// Upload a local image and return its public URL. Falls back to the original uri
// when signed out or on any failure, so the cover always shows even if the cloud
// copy can't be made right now (local-first). Remote (http) uris pass through
// untouched — only local files need uploading.
export async function uploadCover(localUri: string, bookId: string): Promise<string> {
  if (!localUri.startsWith('file:')) return localUri;

  const uid = await currentUserId();
  if (!uid) return localUri; // signed out → keep the local uri

  try {
    const buffer = await new File(localUri).arrayBuffer();
    const path = `${uid}/${safeId(bookId)}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust so re-uploading to the same path refreshes the cached <Image>.
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (e) {
    console.warn('[cover] upload failed, keeping local copy:', e);
    return localUri;
  }
}

// Best-effort removal of this user's stored cover (e.g. on "Remove cover").
export async function deleteCover(bookId: string): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase.storage.from(BUCKET).remove([`${uid}/${safeId(bookId)}.jpg`]);
  } catch (e) {
    console.warn('[cover] delete failed:', e);
  }
}
