import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, ShelfEntry, ShelfBook, ReadingStatus } from '../types/book';
import { pushBook, removeBook } from '../lib/sync';

interface BookshelfState {
  books: Record<string, Book>;
  shelf: Record<string, ShelfEntry>;
  addToShelf: (book: Book, status: ReadingStatus) => void;
  removeFromShelf: (bookId: string) => void;
  updateShelfEntry: (bookId: string, updates: Partial<ShelfEntry>) => void;
  toggleBookShelf: (bookId: string, shelfName: string) => void;
  renameShelfMembership: (oldName: string, newName: string) => void;
  removeShelfMembership: (name: string) => void;
  setBookCover: (bookId: string, coverUrl: string | undefined) => void;
  updateBook: (bookId: string, updates: Partial<Book>) => void;
  getShelfBooks: (status?: ReadingStatus) => ShelfBook[];
  getShelfEntry: (bookId: string) => ShelfEntry | undefined;
  getShelfBook: (bookId: string) => ShelfBook | undefined;
  hydrate: (books: Record<string, Book>, shelf: Record<string, ShelfEntry>) => void;
  clear: () => void;
}

export const useBookshelfStore = create<BookshelfState>()(
  persist(
    (set, get) => ({
      books: {},
      shelf: {},

      addToShelf: (book, status) => {
        const prev = get().shelf[book.id];
        const now = new Date().toISOString();
        // Re-adding an existing book (e.g. wishlist → shelf) keeps its notes/
        // progress and only updates the status.
        const entry: ShelfEntry = prev
          ? { ...prev, status, startedAt: status === 'reading' && !prev.startedAt ? now : prev.startedAt }
          : { bookId: book.id, status, addedAt: now, startedAt: status === 'reading' ? now : undefined };
        set((state) => ({
          books: { ...state.books, [book.id]: book },
          shelf: { ...state.shelf, [book.id]: entry },
        }));
        pushBook(book, entry); // no-op when signed out
      },

      removeFromShelf: (bookId) => {
        set((state) => {
          const { [bookId]: _book, ...books } = state.books;
          const { [bookId]: _entry, ...shelf } = state.shelf;
          return { books, shelf };
        });
        removeBook(bookId);
      },

      updateShelfEntry: (bookId, updates) => {
        const existing = get().shelf[bookId];
        if (!existing) return;
        const merged = { ...existing, ...updates };
        set((state) => ({ shelf: { ...state.shelf, [bookId]: merged } }));
        const book = get().books[bookId];
        if (book) pushBook(book, merged);
      },

      toggleBookShelf: (bookId, shelfName) => {
        const existing = get().shelf[bookId];
        if (!existing) return;
        const current = existing.shelves ?? [];
        const shelves = current.includes(shelfName)
          ? current.filter((n) => n !== shelfName)
          : [...current, shelfName];
        const merged = { ...existing, shelves };
        set((state) => ({ shelf: { ...state.shelf, [bookId]: merged } }));
        const book = get().books[bookId];
        if (book) pushBook(book, merged);
      },

      // Cascade a shelf rename across every book filed on it, so membership
      // never points at a stale name. Pushes each changed book to the cloud.
      renameShelfMembership: (oldName, newName) => {
        const shelf = get().shelf;
        const next: Record<string, ShelfEntry> = {};
        const changed: string[] = [];
        for (const [id, entry] of Object.entries(shelf)) {
          if ((entry.shelves ?? []).includes(oldName)) {
            next[id] = { ...entry, shelves: entry.shelves!.map((n) => (n === oldName ? newName : n)) };
            changed.push(id);
          } else {
            next[id] = entry;
          }
        }
        if (!changed.length) return;
        set({ shelf: next });
        const books = get().books;
        changed.forEach((id) => books[id] && pushBook(books[id], next[id]));
      },

      // Drop a deleted shelf from every book that was filed on it.
      removeShelfMembership: (name) => {
        const shelf = get().shelf;
        const next: Record<string, ShelfEntry> = {};
        const changed: string[] = [];
        for (const [id, entry] of Object.entries(shelf)) {
          if ((entry.shelves ?? []).includes(name)) {
            next[id] = { ...entry, shelves: entry.shelves!.filter((n) => n !== name) };
            changed.push(id);
          } else {
            next[id] = entry;
          }
        }
        if (!changed.length) return;
        set({ shelf: next });
        const books = get().books;
        changed.forEach((id) => books[id] && pushBook(books[id], next[id]));
      },

      setBookCover: (bookId, coverUrl) => {
        const book = get().books[bookId];
        if (!book) return;
        const updated = { ...book, coverUrl };
        set((state) => ({ books: { ...state.books, [bookId]: updated } }));
        const entry = get().shelf[bookId];
        if (entry) pushBook(updated, entry);
      },

      updateBook: (bookId, updates) => {
        const book = get().books[bookId];
        if (!book) return;
        const updated = { ...book, ...updates };
        set((state) => ({ books: { ...state.books, [bookId]: updated } }));
        const entry = get().shelf[bookId];
        if (entry) pushBook(updated, entry);
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

      // Replace local state from a remote pull (no push-back).
      hydrate: (books, shelf) => set({ books, shelf }),

      // Wipe local state on sign-out.
      clear: () => set({ books: {}, shelf: {} }),
    }),
    {
      name: 'ibookshelf-library',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the data is persisted; the action functions come from the initializer.
      partialize: (state) => ({ books: state.books, shelf: state.shelf }),
    },
  ),
);
