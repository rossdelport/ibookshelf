import { create } from 'zustand';
import type { Book, ShelfEntry, ShelfBook, ReadingStatus } from '../types/book';

interface BookshelfState {
  books: Record<string, Book>;
  shelf: Record<string, ShelfEntry>;
  addToShelf: (book: Book, status: ReadingStatus) => void;
  removeFromShelf: (bookId: string) => void;
  updateShelfEntry: (bookId: string, updates: Partial<ShelfEntry>) => void;
  getShelfBooks: (status?: ReadingStatus) => ShelfBook[];
  getShelfEntry: (bookId: string) => ShelfEntry | undefined;
}

export const useBookshelfStore = create<BookshelfState>((set, get) => ({
  books: {},
  shelf: {},

  addToShelf: (book, status) => {
    set((state) => ({
      books: { ...state.books, [book.id]: book },
      shelf: {
        ...state.shelf,
        [book.id]: {
          bookId: book.id,
          status,
          addedAt: new Date().toISOString(),
          startedAt: status === 'reading' ? new Date().toISOString() : undefined,
        },
      },
    }));
  },

  removeFromShelf: (bookId) => {
    set((state) => {
      const { [bookId]: _book, ...books } = state.books;
      const { [bookId]: _entry, ...shelf } = state.shelf;
      return { books, shelf };
    });
  },

  updateShelfEntry: (bookId, updates) => {
    set((state) => ({
      shelf: {
        ...state.shelf,
        [bookId]: { ...state.shelf[bookId], ...updates },
      },
    }));
  },

  getShelfBooks: (status) => {
    const { books, shelf } = get();
    return Object.values(shelf)
      .filter((entry) => !status || entry.status === status)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .map((entry) => ({ ...books[entry.bookId], shelf: entry }))
      .filter((b): b is ShelfBook => !!b.id);
  },

  getShelfEntry: (bookId) => get().shelf[bookId],
}));
