// recommend-books — "For you" book recommendations.
//
// Given a reader's recent favourites + preferred genres, asks Claude for a short
// hand-picked list, each with a one-line editorial "why", and returns real,
// addable titles the reader does NOT already have. The Anthropic key lives ONLY
// here as a Supabase secret (ANTHROPIC_API_KEY) — it is never shipped in the app
// bundle. Title resolution to real covers happens client-side via Google Books.
//
// Deploy:  supabase functions deploy recommend-books   (or via the Supabase MCP)
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// Unpinned so deploy always resolves a valid published version; messages.create
// with these basic params is stable across SDK releases.
import Anthropic from 'npm:@anthropic-ai/sdk';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Loved { title: string; author?: string; rating?: number }
interface Body { loved?: Loved[]; genres?: string[]; exclude?: string[]; count?: number }
interface Pick { title: string; author: string; reason: string }

// The taste-critical part. The voice must read like a well-read friend's shelf
// card — never like a recommendation engine. No "AI", no "because you read".
const SYSTEM = `You are the in-house book curator for a personal reading app — a well-read, discerning friend, not a search engine or a marketing bot.

You are given a reader's recent favourites and preferred genres. Recommend books they would likely love and do NOT already have.

For every pick:
- A real, published book. Use the exact canonical title and the primary author's name.
- Never recommend anything in the "exclude" list (they already have it).
- Vary the list — don't stack the same author or one narrow sub-genre.
- Be a little adventurous: blend an accessible crowd-pleaser with one or two quieter gems, not only #1 bestsellers.

The "reason" is ONE short sentence (about 8–14 words) in a warm, literary, editorial voice — the kind of line a thoughtful bookseller writes by hand on a shelf card.
- Evocative and specific to how the book feels to read.
- It must NOT mention AI, algorithms, data, "recommended", "suggested", "based on your", or "because you read".
- Do NOT begin with "If you liked", "Fans of", or "For readers who".
- No emoji. Do not repeat the title or author inside the reason.

Return ONLY minified JSON — no prose, no markdown, no code fences — in exactly this shape:
{"picks":[{"title":"","author":"","reason":""}]}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'not_configured' }, 503);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const loved = (body.loved ?? []).slice(0, 25);
  const genres = (body.genres ?? []).slice(0, 12);
  const exclude = (body.exclude ?? []).slice(0, 250);
  const count = Math.min(Math.max(body.count ?? 8, 1), 10);

  // Nothing to go on — let the client hide the section rather than guess.
  if (loved.length === 0 && genres.length === 0) return json({ picks: [] }, 200);

  const profile = JSON.stringify({ loved, genres, exclude, want: count });

  try {
    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Recommend ${count} books. Reader profile:\n${profile}` }],
    });

    // deno-lint-ignore no-explicit-any
    const text = (res.content as any[])
      .map((b) => (b?.type === 'text' ? String(b.text ?? '') : ''))
      .join('');

    const picks = parsePicks(text).filter((p) => p.title && p.author);
    return json({ picks }, 200);
  } catch (err) {
    console.error('[recommend-books]', err);
    return json({ error: 'upstream' }, 502);
  }
});

// Defensive parse: strip any stray code fences, then read the first {...} block.
function parsePicks(text: string): Pick[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const picks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    // deno-lint-ignore no-explicit-any
    return picks.map((p: any) => ({
      title: String(p?.title ?? '').trim(),
      author: String(p?.author ?? '').trim(),
      reason: String(p?.reason ?? '').trim(),
    }));
  } catch {
    return [];
  }
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
