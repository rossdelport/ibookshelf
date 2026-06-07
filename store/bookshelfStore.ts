import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, ShelfEntry, ShelfBook, ReadingStatus } from '../types/book';

interface BookshelfState {
  books: Record<string, Book>;
  shelf: Record<string, ShelfEntry>;
  addToShelf: (book: Book, status: ReadingStatus) => void;
  removeFromShelf: (bookId: string) => void;
  updateShelfEntry: (bookId: string, updates: Partial<ShelfEntry>) => void;
  getShelfBooks: (status?: ReadingStatus) => ShelfBook[];
  getShelfEntry: (bookId: string) => ShelfEntry | undefined;
  getShelfBook: (bookId: string) => ShelfBook | undefined;
}

export const useBookshelfStore = create<BookshelfState>()(
  persist(
    (set, get) => ({
      books: {},
      shelf: {},

      addToShelf: (book, status) => {
        set((state) => {
          const prev = state.shelf[book.id];
          const now = new Date().toISOString();
          // Re-adding an existing book (e.g. wishlist → shelf) keeps its notes/
          // progress and only updates the status.
          const entry: ShelfEntry = prev
            ? { ...prev, status, startedAt: status === 'reading' && !prev.startedAt ? now : prev.startedAt }
            : { bookId: book.id, status, addedAt: now, startedAt: status === 'reading' ? now : undefined };
          return {
            books: { ...state.books, [book.id]: book },
            shelf: { ...state.shelf, [book.id]: entry },
          };
        });
      },

      removeFromShelf: (bookId) => {
        set((state) => {
          const { [bookId]: _book, ...books } = state.books;
          const { [bookId]: _entry, ...shelf } = state.shelf;
          return { books, shelf };
        });
      },

      updateShelfEntry: (bookId, updates) => {
        set((state) => {
          const existing = state.shelf[bookId];
          if (!existing) return state;
          return {
            shelf: { ...state.shelf, [bookId]: { ...existing, ...updates } },
          };
        });
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

      getShelfBook: (bookId) => {
        const { books, shelf } = get();
        const entry = shelf[bookId];
        const book = books[bookId];
        if (!entry || !book) return undefined;
        return { ...book, shelf: entry };
      },
    }),
    {
      name: 'ibookshelf-library',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the data is persisted; the action functions come from the initializer.
      partialize: (state) => ({ books: state.books, shelf: state.shelf }),
    },
  ),
);
