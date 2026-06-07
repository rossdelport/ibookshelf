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
  const book = (await fromGoogle(cleaned)) ?? (await fromOpenLibrary(cleaned));
  // If we got the book but no cover, try Open Library's cover-by-ISBN.
  if (book && !book.coverUrl && book.isbn) {
    const ol = openLibraryCoverUrl(book.isbn);
    if (await coverExists(ol)) book.coverUrl = ol;
  }
  return book;
}

// ── Cover helpers ───────────────────────────────────────────────────────────
// Prefer the largest Google image; force https (RN blocks http) and drop the
// page-curl flag for a clean, sharp cover.
function bestCover(links?: {
  smallThumbnail?: string; thumbnail?: string; small?: string; medium?: string; large?: string; extraLarge?: string;
}): string | undefined {
  const raw =
    links?.extraLarge ?? links?.large ?? links?.medium ?? links?.thumbnail ?? links?.small ?? links?.smallThumbnail;
  return raw?.replace(/^http:/, 'https:').replace('&edge=curl', '');
}

// Open Library's deterministic cover-by-ISBN (large). No API call to build it.
export function openLibraryCoverUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
}

// True only if the URL resolves to a real image (OL returns 404 with
// ?default=false when it has no art for that ISBN).
export async function coverExists(url: string): Promise<boolean> {
  try {
    const u = url.includes('covers.openlibrary.org') ? `${url}?default=false` : url;
    const res = await fetch(u);
    return res.ok;
  } catch {
    return false;
  }
}

// Free-text search (title/author) via Google Books — for adding books you
// can't or won't scan. Returns up to ~12 results, de-duped. Never throws.
export async function searchBooks(query: string): Promise<Book[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const keyParam = API_KEY ? `&key=${API_KEY}` : '';
    const res = await fetch(`${GOOGLE}?q=${encodeURIComponent(q)}&maxResults=12&printType=books${keyParam}`);
    if (!res.ok) return [];
    const json: { items?: GoogleVolume[] } = await res.json();
    const out: Book[] = [];
    const seen = new Set<string>();
    for (const item of json.items ?? []) {
      const b = bookFromGoogleItem(item);
      if (b && !seen.has(b.id)) {
        seen.add(b.id);
        out.push(b);
      }
    }
    return out;
  } catch {
    return [];
  }
}

// ── Google Books ───────────────────────────────────────────────────────────
interface GoogleVolume {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    description?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: {
      smallThumbnail?: string; thumbnail?: string; small?: string; medium?: string; large?: string; extraLarge?: string;
    };
  };
}

// Map a full Google volume (search result) → Book. Uses its ISBN as the id when
// present, else a stable `gb_<volumeId>` so no-ISBN books still get a unique key.
function bookFromGoogleItem(item: GoogleVolume): Book | null {
  const info = item.volumeInfo;
  if (!info?.title) return null;
  const ids = info.industryIdentifiers ?? [];
  const isbn =
    ids.find((i) => i.type === 'ISBN_13')?.identifier ??
    ids.find((i) => i.type === 'ISBN_10')?.identifier;
  const id = isbn ?? (item.id ? `gb_${item.id}` : undefined);
  if (!id) return null;

  const coverUrl = bestCover(info.imageLinks);

  return {
    id,
    isbn,
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    author: info.authors?.join(', ') ?? 'Unknown author',
    coverUrl,
    pageCount: info.pageCount,
    publishedYear: yearFrom(info.publishedDate),
    genres: info.categories,
    description: info.description,
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

    const coverUrl = bestCover(info.imageLinks);

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
