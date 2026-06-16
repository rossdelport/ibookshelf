import { supabase } from './supabase';
import { searchBooks } from './bookLookup';
import { useBookshelfStore } from '../store/bookshelfStore';
import { useUserStore } from '../store/userStore';
import type { Book } from '../types/book';

// Client side of the "For you" feature. Reads the reader's taste from the local
// stores, asks the recommend-books edge function for picks, then resolves each
// pick to a real, addable Book (with cover) via the existing Google Books
// search — skipping anything already in their library. Never throws: any
// failure (function not deployed, offline, key unset) resolves to [] so the UI
// simply hides, never crashes.

export interface Rec {
  book: Book;
  reason: string; // one-line editorial "why" — rendered in Newsreader italic
}

interface Pick { title: string; author: string; reason: string }

// Loose key for comparing titles (dedupe + library exclusion).
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// The reader's taste signal: books they loved (finished or rated 4+), their
// favourite genres, and every title already in their library (so nothing they
// have — owned OR wishlisted — is ever recommended back to them).
export function readTaste() {
  const { books, shelf } = useBookshelfStore.getState();
  const genres = useUserStore.getState().profile.favouriteGenres ?? [];

  const have: string[] = [];
  const loved: { title: string; author?: string; rating?: number }[] = [];
  for (const entry of Object.values(shelf)) {
    const book = books[entry.bookId];
    if (!book) continue;
    have.push(book.title);
    const liked = entry.status === 'read' || (entry.rating ?? 0) >= 4;
    if (liked && entry.status !== 'wishlist') {
      loved.push({ title: book.title, author: book.author, rating: entry.rating });
    }
  }
  loved.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return { loved: loved.slice(0, 25), genres, have };
}

export function hasEnoughForRecs(): boolean {
  const { loved, genres } = readTaste();
  return loved.length > 0 || genres.length > 0;
}

// Changes only when the loved-set or genres change — so recs regenerate after a
// book is finished/rated, NOT on reading-progress updates or every app open.
export function tasteSignature(): string {
  const { loved, genres } = readTaste();
  const lovedKey = loved.map((l) => norm(l.title)).sort().join('|');
  const genreKey = [...genres].sort().join('|');
  return `${genreKey}#${lovedKey}`;
}

export async function fetchRecommendations(): Promise<Rec[]> {
  const { loved, genres, have } = readTaste();
  if (loved.length === 0 && genres.length === 0) return [];

  let picks: Pick[] = [];
  try {
    const { data, error } = await supabase.functions.invoke('recommend-books', {
      body: { loved, genres, exclude: have.slice(0, 250), count: 8 },
    });
    if (error) return [];
    picks = Array.isArray(data?.picks) ? (data.picks as Pick[]) : [];
  } catch {
    return [];
  }

  const haveSet = new Set(have.map(norm));
  const seen = new Set<string>();
  const out: Rec[] = [];

  for (const pick of picks) {
    if (!pick?.title) continue;
    const key = norm(pick.title);
    if (haveSet.has(key) || seen.has(key)) continue;

    // Resolve the pick to a real Book (cover, isbn) the reader can add.
    const results = await searchBooks(`${pick.title} ${pick.author ?? ''}`.trim());
    const match =
      results.find((b) => {
        const t = norm(b.title);
        return (t.includes(key) || key.includes(t)) && !haveSet.has(t);
      }) ?? results[0];
    if (!match) continue;

    const matchKey = norm(match.title);
    if (haveSet.has(matchKey) || seen.has(matchKey)) continue;
    seen.add(key);
    seen.add(matchKey);
    out.push({ book: match, reason: pick.reason ?? '' });
    if (out.length >= 6) break;
  }
  return out;
}
