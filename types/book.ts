// 'wishlist' = a book you want but don't own yet (kept off the "do I own this?" check).
export type ReadingStatus = 'reading' | 'read' | 'want_to_read' | 'did_not_finish' | 'wishlist';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  pageCount?: number;
  publishedYear?: number;
  genres?: string[];
  description?: string;
}

export interface ShelfEntry {
  bookId: string;
  status: ReadingStatus;
  currentPage?: number;
  rating?: number;
  review?: string;
  notes?: string;        // free-form notes the reader keeps on this book
  shelves?: string[];    // custom-shelf names this book is filed on
  startedAt?: string;
  finishedAt?: string;
  addedAt: string;
}

// A user-defined custom shelf / collection (e.g. "Tom's books", "Mum & Dad").
export interface ShelfDef {
  name: string;
  emoji: string;
  color?: string;   // optional accent colour; undefined = the default ink chip
}

export interface ShelfBook extends Book {
  shelf: ShelfEntry;
}

// A single reading session — the unit behind time tracking, streaks and stats.
// Shape mirrors the Supabase `reading_sessions` table for cloud sync. `id` is
// the stable client id (also the table's `client_id`, for idempotent upserts).
export interface ReadingSession {
  id: string;
  bookId: string;
  startedAt: string; // ISO
  endedAt: string;   // ISO
  seconds: number;   // measured reading time (pauses excluded), user-editable
  startPage?: number;
  endPage?: number;
}
