import type { Book, ShelfEntry, ReadingStatus } from '../types/book';

// Parse a Goodreads or StoryGraph CSV export into addable books. Both exports
// are detected by their headers and mapped onto our Book + ShelfEntry shape.
// Covers aren't in CSV exports, so imported books use the generative cover.

export type ImportFormat = 'goodreads' | 'storygraph' | 'generic';

export interface ImportItem {
  book: Book;
  entry: ShelfEntry;
}

export interface ParseResult {
  items: ImportItem[];
  format: ImportFormat;
  total: number; // data rows seen (excluding header)
}

// ── RFC-4180-ish CSV parser ────────────────────────────────────────────────
// Handles quoted fields with embedded commas, escaped quotes (""), and
// newlines inside quotes (reviews often contain them). Returns rows of cells.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; // skip a UTF-8 BOM
  const n = text.length;

  for (; i < n; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      if (text[i + 1] !== '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      // CRLF: ignore the CR, the LF ends the row
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// ── Field helpers ──────────────────────────────────────────────────────────
const cleanIsbn = (raw: string) => raw.replace(/[^0-9Xx]/g, '');

function mapStatus(raw: string): ReadingStatus {
  const s = raw.toLowerCase().trim();
  if (s === 'read' || s === 'finished') return 'read';
  if (s === 'currently-reading' || s === 'currently reading' || s === 'reading') return 'reading';
  if (s === 'did-not-finish' || s === 'did not finish' || s === 'dnf') return 'did_not_finish';
  // 'to-read', 'to read', 'want to read', or anything unknown → To read.
  return 'want_to_read';
}

function mapRating(raw: string): number | undefined {
  const n = Math.round(parseFloat(raw));
  if (!n || isNaN(n) || n < 1) return undefined;
  return Math.min(5, n);
}

function toInt(raw: string): number | undefined {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? undefined : n;
}

function toIso(raw: string): string | undefined {
  if (!raw.trim()) return undefined;
  const d = new Date(raw.trim().replace(/\//g, '-'));
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Stable id: the ISBN when present (so it dedupes against scanned books), else
// a hash of title+author (so re-importing the same export updates, not dupes).
function makeId(isbn: string, title: string, author: string): string {
  return isbn || `imp_${hash(`${title.toLowerCase()}|${author.toLowerCase()}`)}`;
}

export function parseLibraryCsv(text: string): ParseResult {
  const rows = parseCsv(text);
  if (rows.length < 2) return { items: [], format: 'generic', total: 0 };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const nm of names) {
      const j = headers.indexOf(nm);
      if (j >= 0) return j;
    }
    return -1;
  };

  let format: ImportFormat = 'generic';
  if (headers.includes('exclusive shelf') || headers.includes('book id')) format = 'goodreads';
  else if (headers.includes('read status') || headers.includes('star rating')) format = 'storygraph';

  const iTitle = col('title');
  const iAuthor = col('author', 'authors', 'primary author');
  const iIsbn13 = col('isbn13');
  const iIsbn = col('isbn', 'isbn/uid');
  const iRating = col('my rating', 'star rating');
  const iPages = col('number of pages', 'pages');
  const iYear = col('original publication year', 'year published');
  const iReview = col('my review', 'review');
  const iStatus = col('exclusive shelf', 'read status');
  const iDateRead = col('date read', 'last date read');
  const iDateAdded = col('date added');

  const cell = (r: string[], j: number) => (j >= 0 && j < r.length ? r[j].trim() : '');

  const items: ImportItem[] = [];
  const seen = new Set<string>();
  let total = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0].trim() === '') continue; // blank line
    total++;

    const title = cell(row, iTitle);
    if (!title) continue;
    const author = cell(row, iAuthor) || 'Unknown author';
    const isbn = cleanIsbn(cell(row, iIsbn13)) || cleanIsbn(cell(row, iIsbn));
    const id = makeId(isbn, title, author);
    if (seen.has(id)) continue;
    seen.add(id);

    const status = iStatus >= 0 ? mapStatus(cell(row, iStatus)) : 'want_to_read';
    const pageCount = toInt(cell(row, iPages));
    const dateRead = toIso(cell(row, iDateRead));
    const dateAdded = toIso(cell(row, iDateAdded)) ?? new Date().toISOString();

    const book: Book = {
      id,
      isbn: isbn || undefined,
      title,
      author,
      pageCount,
      publishedYear: toInt(cell(row, iYear)),
    };
    const entry: ShelfEntry = {
      bookId: id,
      status,
      currentPage: status === 'read' && pageCount ? pageCount : 0,
      rating: mapRating(cell(row, iRating)),
      review: cell(row, iReview) || undefined,
      addedAt: dateAdded,
      startedAt: status === 'reading' ? dateRead ?? dateAdded : undefined,
      finishedAt: status === 'read' ? dateRead : undefined,
    };
    items.push({ book, entry });
  }

  return { items, format, total };
}
