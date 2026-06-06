export type ReadingStatus = 'reading' | 'read' | 'want_to_read' | 'did_not_finish';

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
  startedAt?: string;
  finishedAt?: string;
  addedAt: string;
}

export interface ShelfBook extends Book {
  shelf: ShelfEntry;
}
