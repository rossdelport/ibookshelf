import { supabase } from './supabase';
import type { Book, ShelfEntry, ShelfDef } from '../types/book';

// Sync layer between the local zustand stores and Supabase.
// Kept free of store imports so there's no circular dependency: the stores
// call the push helpers here; the auth bootstrap calls fetchRemoteState and
// applies the result to the stores.

let currentUserId: string | null = null;
export function setSyncUser(id: string | null) {
  currentUserId = id;
}

// ── Row shape (mirrors public.library_books) ───────────────────────────────
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
  librarySize: string | null;
  favouriteGenres: string[];
  soulAnimal: string | null;
  avatar: unknown;
  shelves: ShelfDef[];
}

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

// ── Pushes (no-ops when signed out → app stays local-first) ────────────────
// Debounce per book so rapid edits (typing notes / page numbers) collapse
// into a single upsert.
const pushTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function pushBook(book: Book, entry: ShelfEntry) {
  const uid = currentUserId;
  if (!uid) return;
  const key = book.id;
  if (pushTimers[key]) clearTimeout(pushTimers[key]);
  pushTimers[key] = setTimeout(async () => {
    delete pushTimers[key];
    const { error } = await supabase
      .from('library_books')
      .upsert(rowFromLocal(uid, book, entry), { onConflict: 'user_id,isbn' });
    if (error) console.warn('[sync] pushBook failed:', error.message);
  }, 500);
}

export async function removeBook(bookId: string) {
  const uid = currentUserId;
  if (!uid) return;
  if (pushTimers[bookId]) {
    clearTimeout(pushTimers[bookId]);
    delete pushTimers[bookId];
  }
  const { error } = await supabase.from('library_books').delete().eq('user_id', uid).eq('isbn', bookId);
  if (error) console.warn('[sync] removeBook failed:', error.message);
}

export async function pushProfile(profile: ProfileInput) {
  const uid = currentUserId;
  if (!uid) return;
  const { error } = await supabase.from('profiles').upsert(
    {
      id: uid,
      library_size: profile.librarySize,
      favourite_genres: profile.favouriteGenres,
      soul_animal: profile.soulAnimal,
      avatar: profile.avatar ?? null,
      shelves: profile.shelves,
    },
    { onConflict: 'id' },
  );
  if (error) console.warn('[sync] pushProfile failed:', error.message);
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
  if (error) console.warn('[sync] fetchRemoteState failed:', error.message);

  const books: Record<string, Book> = {};
  const shelf: Record<string, ShelfEntry> = {};
  ((rows as LibraryRow[]) ?? []).forEach((r) => {
    const { book, entry } = localFromRow(r);
    books[book.id] = book;
    shelf[book.id] = entry;
  });

  return { profile: (profile as ProfileRow | null) ?? null, books, shelf };
}
