import type { Book } from '../types/book';

// ISBN → book metadata. Tries Google Books first (richer data); if that's
// rate-limited / empty / errors, falls back to Open Library so a scan still
// resolves. Never throws — failures resolve to `null`.

const GOOGLE = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY = 'https://openlibrary.org/api/books';

// Optional — Google Books works unauthenticated but is IP-rate-limited.
// Set EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY in .env to raise the limit.
// (EXPO_PUBLIC_ vars are inlined into the app bundle; restrict the key in
// Google Cloud Console by app id — it is not a true secret on the client.)
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

export async function lookupBookByIsbn(isbn: string): Promise<Book | null> {
  const cleaned = isbn.replace(/[^0-9Xx]/g, '');
  if (!cleaned) return null;
  return (await fromGoogle(cleaned)) ?? (await fromOpenLibrary(cleaned));
}

// ── Google Books ───────────────────────────────────────────────────────────
interface GoogleVolume {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    description?: string;
    imageLinks?: { smallThumbnail?: string; thumbnail?: string };
  };
}

async function fromGoogle(isbn: string): Promise<Book | null> {
  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const res = await fetch(`${GOOGLE}?q=isbn:${encodeURIComponent(isbn)}&maxResults=1${keyParam}`);
    if (!res.ok) return null;

    const json: { items?: GoogleVolume[] } = await res.json();
    const info = json.items?.[0]?.volumeInfo;
    if (!info?.title) return null;

    // Google serves covers over http with a page-curl flag — force https
    // (RN blocks http) and drop the curl for a clean cover.
    const raw = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
    const coverUrl = raw?.replace(/^http:/, 'https:').replace('&edge=curl', '');

    return {
      id: isbn,
      isbn,
      title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
      author: info.authors?.join(', ') ?? 'Unknown author',
      coverUrl,
      pageCount: info.pageCount,
      publishedYear: yearFrom(info.publishedDate),
      genres: info.categories,
      description: info.description,
    };
  } catch {
    return null;
  }
}

// ── Open Library (fallback) ────────────────────────────────────────────────
interface OpenLibraryBook {
  title?: string;
  subtitle?: string;
  authors?: { name?: string }[];
  number_of_pages?: number;
  publish_date?: string;
  subjects?: { name?: string }[];
  cover?: { small?: string; medium?: string; large?: string };
}

async function fromOpenLibrary(isbn: string): Promise<Book | null> {
  try {
    const res = await fetch(`${OPEN_LIBRARY}?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`);
    if (!res.ok) return null;

    const json: Record<string, OpenLibraryBook> = await res.json();
    const data = json[`ISBN:${isbn}`];
    if (!data?.title) return null;

    return {
      id: isbn,
      isbn,
      title: data.subtitle ? `${data.title}: ${data.subtitle}` : data.title,
      author: data.authors?.map((a) => a.name).filter(Boolean).join(', ') || 'Unknown author',
      coverUrl: data.cover?.large ?? data.cover?.medium ?? data.cover?.small,
      pageCount: data.number_of_pages,
      publishedYear: yearFrom(data.publish_date),
      genres: data.subjects?.map((s) => s.name).filter((n): n is string => !!n).slice(0, 3),
    };
  } catch {
    return null;
  }
}

function yearFrom(date?: string): number | undefined {
  const y = date?.match(/\d{4}/)?.[0];
  return y ? Number(y) : undefined;
}
