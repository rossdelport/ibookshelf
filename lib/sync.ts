import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { useSyncStore } from '../store/syncStore';
import type { Book, ShelfEntry, ShelfDef } from '../types/book';

// Sync layer between the local zustand stores and Supabase, hardened with a
// persistent retry queue so a flaky network never silently drops a change.
// Kept free of store imports (except the status store it writes to) so there's
// no circular dependency: the data stores call the push helpers here; the auth
// bootstrap calls fetchRemoteState and applies the result to the stores.

const QUEUE_KEY = 'ibookshelf-sync-queue';
const FLUSH_DEBOUNCE = 400;
const MAX_BACKOFF = 60_000;

let currentUserId: string | null = null;
let online = true;
let flushing = false;
let initialised = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let backoff = 2_000;

// ── Row shapes (mirror the Supabase tables) ────────────────────────────────
export interface LibraryRow {
  id?: string;
  user_id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number | null;
  published_year: number | null;
  genres: string[] | null;
  description: string | null;
  status: string;
  current_page: number;
  rating: number | null;
  review: string | null;
  notes: string | null;
  shelves: string[] | null;
  started_at: string | null;
  finished_at: string | null;
  added_at: string;
}

export interface ProfileRow {
  id: string;
  username: string | null;
  library_size: string | null;
  favourite_genres: string[] | null;
  soul_animal: string | null;
  avatar: unknown | null;
  shelves: ShelfDef[] | null;
}

interface ProfileInput {
  username: string | null;
  librarySize: string | null;
  favouriteGenres: string[];
  soulAnimal: string | null;
  avatar: unknown;
  shelves: ShelfDef[];
}

// ── The persistent queue ────────────────────────────────────────────────────
type PendingBook =
  | { op: 'upsert'; row: LibraryRow }
  | { op: 'delete'; userId: string; isbn: string };

interface ProfilePending {
  id: string;
  username: string | null;
  library_size: string | null;
  favourite_genres: string[];
  soul_animal: string | null;
  avatar: unknown;
  shelves: ShelfDef[];
}

interface Queue {
  books: Record<string, PendingBook>; // keyed by local book id (auto-dedupes)
  profile: ProfilePending | null;
}

let queue: Queue = { books: {}, profile: null };

function pendingCount(): number {
  return Object.keys(queue.books).length + (queue.profile ? 1 : 0);
}

function persistQueue() {
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
}

function setStatus(status: ReturnType<typeof useSyncStore.getState>['status'], synced = false) {
  useSyncStore.setState({
    status,
    pending: pendingCount(),
    ...(synced ? { lastSyncedAt: Date.now() } : {}),
  });
}

function bumpPending() {
  useSyncStore.setState({ pending: pendingCount() });
}

// ── Mapping ──────────────────────────────────────────────────────────────────
function rowFromLocal(userId: string, book: Book, entry: ShelfEntry): LibraryRow {
  return {
    user_id: userId,
    isbn: book.isbn ?? book.id,
    title: book.title,
    author: book.author ?? null,
    cover_url: book.coverUrl ?? null,
    page_count: book.pageCount ?? null,
    published_year: book.publishedYear ?? null,
    genres: book.genres ?? null,
    description: book.description ?? null,
    status: entry.status,
    current_page: entry.currentPage ?? 0,
    rating: entry.rating ?? null,
    review: entry.review ?? null,
    notes: entry.notes ?? null,
    shelves: entry.shelves ?? [],
    started_at: entry.startedAt ?? null,
    finished_at: entry.finishedAt ?? null,
    added_at: entry.addedAt,
  };
}

export function localFromRow(row: LibraryRow): { book: Book; entry: ShelfEntry } {
  const id = row.isbn ?? row.id!;
  return {
    book: {
      id,
      isbn: row.isbn ?? undefined,
      title: row.title,
      author: row.author ?? 'Unknown author',
      coverUrl: row.cover_url ?? undefined,
      pageCount: row.page_count ?? undefined,
      publishedYear: row.published_year ?? undefined,
      genres: row.genres ?? undefined,
      description: row.description ?? undefined,
    },
    entry: {
      bookId: id,
      status: row.status as ShelfEntry['status'],
      currentPage: row.current_page,
      rating: row.rating ?? undefined,
      review: row.review ?? undefined,
      notes: row.notes ?? undefined,
      shelves: row.shelves ?? undefined,
      startedAt: row.started_at ?? undefined,
      finishedAt: row.finished_at ?? undefined,
      addedAt: row.added_at,
    },
  };
}

// ── Public push API (enqueue + schedule flush; no-ops when signed out) ──────
export function pushBook(book: Book, entry: ShelfEntry) {
  if (!currentUserId) return;
  queue.books[book.id] = { op: 'upsert', row: rowFromLocal(currentUserId, book, entry) };
  onQueueChanged();
}

export function removeBook(bookId: string) {
  if (!currentUserId) return;
  queue.books[bookId] = { op: 'delete', userId: currentUserId, isbn: bookId };
  onQueueChanged();
}

export function pushProfile(profile: ProfileInput) {
  if (!currentUserId) return;
  queue.profile = {
    id: currentUserId,
    username: profile.username,
    library_size: profile.librarySize,
    favourite_genres: profile.favouriteGenres,
    soul_animal: profile.soulAnimal,
    avatar: profile.avatar ?? null,
    shelves: profile.shelves,
  };
  onQueueChanged();
}

function onQueueChanged() {
  persistQueue();
  bumpPending();
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flush(), FLUSH_DEBOUNCE);
}

// ── Flush ────────────────────────────────────────────────────────────────────
async function flush() {
  if (flushing || !currentUserId) return;
  if (pendingCount() === 0) {
    setStatus('idle');
    return;
  }
  if (!online) {
    setStatus('offline');
    return;
  }

  flushing = true;
  setStatus('syncing');
  let hadError = false;

  for (const id of Object.keys(queue.books)) {
    const op = queue.books[id];
    try {
      if (op.op === 'upsert') {
        const { error } = await supabase.from('library_books').upsert(op.row, { onConflict: 'user_id,isbn' });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('library_books').delete().eq('user_id', op.userId).eq('isbn', op.isbn);
        if (error) throw error;
      }
      delete queue.books[id];
    } catch {
      hadError = true;
    }
  }

  if (queue.profile) {
    try {
      const { error } = await supabase.from('profiles').upsert(queue.profile, { onConflict: 'id' });
      if (error) throw error;
      queue.profile = null;
    } catch {
      hadError = true;
    }
  }

  persistQueue();
  flushing = false;

  if (pendingCount() === 0) {
    backoff = 2_000;
    setStatus('idle', true);
  } else {
    setStatus(hadError ? 'error' : 'syncing');
    scheduleRetry();
  }
}

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => flush(), backoff);
  backoff = Math.min(backoff * 2, MAX_BACKOFF);
}

// Force an immediate sync attempt (the "back up now" tap).
export function forceSync() {
  backoff = 2_000;
  if (retryTimer) clearTimeout(retryTimer);
  flush();
}

// ── User / lifecycle ─────────────────────────────────────────────────────────
export function setSyncUser(id: string | null) {
  if (id && id !== currentUserId) {
    // Switching users — drop any queued ops that belong to a different account.
    for (const key of Object.keys(queue.books)) {
      const op = queue.books[key];
      const owner = op.op === 'upsert' ? op.row.user_id : op.userId;
      if (owner !== id) delete queue.books[key];
    }
    if (queue.profile && queue.profile.id !== id) queue.profile = null;
    persistQueue();
  }
  currentUserId = id;
  if (id) {
    backoff = 2_000;
    scheduleFlush();
  } else {
    setStatus('idle');
  }
}

// Load the persisted queue + wire connectivity/foreground triggers. Call once.
export async function initSync() {
  if (initialised) return;
  initialised = true;

  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) queue = JSON.parse(raw) as Queue;
  } catch {
    /* corrupt queue — start fresh */
  }
  bumpPending();

  const net = await NetInfo.fetch().catch(() => null);
  online = net?.isConnected !== false;

  NetInfo.addEventListener((state) => {
    const next = state.isConnected !== false;
    const reconnected = next && !online;
    online = next;
    if (!online) setStatus('offline');
    else if (reconnected) forceSync();
  });

  AppState.addEventListener('change', (s) => {
    if (s === 'active') scheduleFlush();
  });

  if (currentUserId) scheduleFlush();
  else setStatus(pendingCount() > 0 ? (online ? 'syncing' : 'offline') : 'idle');
}

// ── Pull ───────────────────────────────────────────────────────────────────
export async function fetchRemoteState(): Promise<{
  profile: ProfileRow | null;
  books: Record<string, Book>;
  shelf: Record<string, ShelfEntry>;
} | null> {
  const uid = currentUserId;
  if (!uid) return null;

  const [{ data: profile }, { data: rows, error }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('library_books').select('*').eq('user_id', uid),
  ]);
  if (error) {
    // A failed pull must never wipe local data — signal and bail.
    console.warn('[sync] fetchRemoteState failed:', error.message);
    return null;
  }

  const books: Record<string, Book> = {};
  const shelf: Record<string, ShelfEntry> = {};
  ((rows as LibraryRow[]) ?? []).forEach((r) => {
    const { book, entry } = localFromRow(r);
    books[book.id] = book;
    shelf[book.id] = entry;
  });

  return { profile: (profile as ProfileRow | null) ?? null, books, shelf };
}
