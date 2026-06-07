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
}

export interface ShelfBook extends Book {
  shelf: ShelfEntry;
}
