# iBookshelf – Design System & Build Spec

> Give this file to Claude (or any dev) before building a screen. Follow it exactly and every
> screen will match. The golden rule: **reuse the tokens and class patterns below — never
> invent new colors, fonts, radii, or shadows.** When something isn't covered here, derive it
> from the nearest existing pattern, don't freestyle.

---

## 0. The vibe in one sentence

A warm, cozy "reading sanctuary" — cream paper backgrounds, amber candle-glow accent,
ink-brown text, rounded soft cards with hairline brown borders, and a Nunito (UI) + Lora
(literary serif) type pairing. Think: a well-loved physical bookshelf, not a sterile app.

Never make it feel cold, flat, neon, or "tech-y." No pure white (#FFFFFF backgrounds), no
pure black, no blue-grey neutrals, no hard 1px black borders.

---

## 1. Tech & file architecture

Every screen is a **React + Babel** prototype rendered inside an **iOS device frame** at
**393 × 852** (iPhone 15/16). Structure mirrors the existing screens — copy it exactly.

### HTML host (one per screen, e.g. `iBookshelf Home.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iBookshelf – Home</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=Lora:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="app.css" />
  <style>
    html, body { margin: 0; height: 100%; }
    body {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 40px;
      background: radial-gradient(120% 90% at 50% 0%, #F3ECE0 0%, #ECE3D4 55%, #E4D8C5 100%);
      font-family: 'Nunito', -apple-system, system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <!-- pinned React + Babel (use these EXACT tags, do not change versions) -->
  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
  <script type="text/babel" src="ios-frame.jsx"></script>
  <script type="text/babel" src="yourscreen.jsx"></script>
  <script type="text/babel">
    ReactDOM.createRoot(document.getElementById('root'))
      .render(<IOSDevice width={393} height={852}><YourScreen /></IOSDevice>);
  </script>
</body>
</html>
```

### Rules
- **All shared styling lives in `app.css`.** Add a new screen's styles as a clearly-commented
  section there (see the `————` banner comment style already used). Keep the JSX using
  semantic class names, not inline styles, for anything reusable.
- **Wrap every screen in `<IOSDevice width={393} height={852}>`** from `ios-frame.jsx`. Don't
  pass its `title` prop (we use our own topbars). For camera/dark screens, the screen itself
  paints the dark bg.
- **One `.jsx` file per screen**, named after it (`home.jsx`, `shelf.jsx`, `scanner.jsx`…).
- If a screen file shares components with others, export them with
  `Object.assign(window, { ... })` at the bottom (Babel scripts don't share scope).
- **Never name a styles object `const styles`** — collisions break everything. Use
  `const homeStyles = {...}` etc., or just use CSS classes.
- The root screen element is `<div className="screen">` (add a modifier like `screen lib`,
  `screen comm`, `screen scanner` per screen). It is `height:100%`, column flex, with the
  scroll region in the middle and a sticky `.tabbar` at the bottom.

---

## 2. Color tokens

Use these literally. They're warm by design — neutrals carry brown, never grey.

| Token | Hex | Use |
|---|---|---|
| **Paper** (app bg) | `#FAF8F3` | default screen background |
| Paper gradient | `linear-gradient(180deg, #FAF8F3 0%, #F3ECDF 100%)` | shelf / community bg |
| Body-frame bg | `radial-gradient(120% 90% at 50% 0%, #F3ECE0, #ECE3D4 55%, #E4D8C5)` | behind the phone |
| Card surface | `#FFFFFF` | cards, rows, fields (the ONLY place pure white appears) |
| Warm sub-surface | `#F6EFE2` | icon tiles, inset chips |
| Cream tint (selected) | `#FFFBF2` | selected card fill |
| **Ink** (primary text) | `#332C24` | headings, primary text |
| Body text | `#463E33` | long-form post body |
| **Brown** (secondary) | `#8B5E3C` | links, emphasis, secondary labels |
| **Mute** (tertiary) | `#A89A88` | captions, metadata, placeholders |
| Soft mute | `#6b6052` / `#8a7d6d` | sub-copy |
| **Amber** (primary accent) | `#E8A838` | brand accent, active states, progress |
| Amber deep | `#E29A2A` | gradient end, accent text |
| Amber gradient | `linear-gradient(180deg, #EFB551 0%, #E29A2A 100%)` | primary buttons |
| Amber pale (chip bg) | `#FBEACB` / `#FBF1DC` | soft accent pills/badges |
| Amber text-on-pale | `#C0851E` / `#C99A4C` | text on amber-pale |
| Success green | `#5BA66E` | "found"/confirm states |
| Success pale | `#E9F4EC` | success pill bg |
| Like red | `#E0506B` | liked heart |
| Dark surface | `#2A2420` / `#332C24` | dark buttons (Apple-login, solid CTA) |
| Camera black | `#100C09` | scanner screen bg |

### Border & shadow recipes (don't deviate)
- **Hairline border:** `0.5px solid rgba(139,94,60,0.12)` (the brown `139,94,60` at low alpha
  is *the* border color — use `0.10`–`0.18` alpha depending on emphasis).
- **Selected border:** `1.5px solid #E8A838`.
- **Soft card shadow:** `0 3px 12px rgba(139,94,60,0.06)` (raise to `0 3px 14px …0.07` for posts).
- **Tiny shadow:** `0 2px 8px rgba(139,94,60,0.05)`.
- **Amber button glow:** `0 6px 16px rgba(226,154,42,0.40), inset 0 1px 0 rgba(255,255,255,0.4)`.
- **Book/cover shadow** (browny, directional): `1px 3px 9px rgba(90,60,35,0.22)` and
  `inset 6px 0 11px rgba(0,0,0,0.30)` for the spine.
- Avatars always get a white ring: `box-shadow: 0 0 0 2px #fff`.

**All shadows are brown-tinted** (`rgba(139,94,60,…)` for UI, `rgba(90,60,35,…)` for books).
Never use neutral-grey `rgba(0,0,0,…)` shadows on light surfaces.

---

## 3. Typography

Two families only:

- **Nunito** — all UI: labels, buttons, body, numbers. Heavy weights (700/800) carry the brand.
- **Lora** (serif, often *italic*) — anything "literary": book titles, author names, pull
  quotes, emotional hero lines, the wordmark.

### Scale (px, mobile)
| Role | Size / weight / family |
|---|---|
| Screen H1 (greeting/title) | 25–27px / 800 / Nunito, `letter-spacing:-0.4 to -0.5px` |
| Onboarding title (serif variant) | 30px / 600 / Lora |
| Section/card title | 16–17px / 800 / Nunito |
| Book title (literary) | 18–21px / 600 / **Lora** |
| Author / quote source | 12.5–14px / **Lora italic** / Mute |
| Body / post text | 14.5px / 500 / Nunito, `line-height:1.5`, `text-wrap:pretty` |
| Row title | 14.5–15px / 800 |
| Caption / metadata | 12–13px / 600 / Mute |
| Kicker / eyebrow | 12.5px / 800 / `letter-spacing:1.4px` / `uppercase` / `#C99A4C` |
| Section label (caps) | 13px / 800 / `letter-spacing:0.4px` / `uppercase` / `#B08A52` |
| Tabbar label | 10.5px / 700–800 |
| Stat value | 21px / 800 / `letter-spacing:-0.3px` |

Big numbers (stats, streaks) are Nunito 800 with slight negative tracking. Pull quotes and
book titles are Lora; setting them in Lora is what makes the app feel literary — don't forget.

---

## 4. Shape, spacing & motion

- **Radii:** pills/avatars `999px`; primary buttons `18px`; big cards `22px`; cards/posts
  `20px`; rows & fields `16px`; small chips/tiles `13–14px`; book covers `3px 5px 5px 3px`
  (asymmetric — the spine corner is tighter).
- **Screen padding:** horizontal `20–22px`. Topbars start `~52–60px` from top (under the
  status bar / dynamic island). Bottom scroll padding `~26–28px` before the tabbar.
- **Gaps:** card lists `12–14px`; tight rows `10px`; chip rows `8–10px`; stat grid `10px`.
  Always use flex/grid `gap`, never margins-between-siblings.
- **Inner card padding:** big cards `16px`; rows `12–18px`; pills `8–11px × 14–20px`.
- **Motion:** subtle and quick. Press states `transform: scale(0.93)` / `translateY(-2px)` at
  `0.12–0.18s ease`. Sheets rise with `cubic-bezier(0.22,1,0.36,1)`. Confirmations pop with
  `cubic-bezier(0.22,1.4,0.4,1)`. Scanner line + spinner loop. No gratuitous animation.

---

## 5. Core components (match these exactly)

### Primary button (CTA)
Amber gradient pill, white 800 text, glow shadow. Full-width onboarding variant = `.ob-cta`
(radius 18). Compact home variant = `.start-btn` (radius 999). Disabled = `#EFE7D8` bg /
`#C0B4A0` text, no shadow. Ghost variant = white bg, brown text, hairline border.

### Secondary / dark button
`#332C24` (or `#2A2420`) bg, white text, no border — used for "Join", solid confirm, Apple login.

### Chip / pill
White bg, hairline border, brown text, `999px`. **On state** = amber fill `#E8A838`, white text,
amber glow. Filter chips' active state can instead be ink fill `#332C24` (see `.lib-chip.active`,
`.seg-btn.on`). Soft badge variant = amber-pale bg `#FBEACB` + `#C0851E` text.

### Card / list row
White surface, hairline border, soft brown shadow, radius 16–20. Selectable rows get a
left icon tile (`#F6EFE2`, radius 12–14, emoji/icon inside) + title + meta + a trailing
radio/check. **Selected** = `#FFFBF2` fill, `1.5px #E8A838` border, amber glow, icon tile
turns `#FBEACB`.

### Segmented control
`#EFE6D6` track, `4px` padding, `999px`. Active segment = `#332C24` fill, white text, subtle
shadow. (`.seg` / `.seg-btn`.)

### Stat tile
White, radius 18, centered: emoji (17px) → value (21/800) → label (11/600 Mute).

### Avatar + "soul" badge
Round avatar with white ring. A small white circle badge (the user's "soul animal" emoji)
overlaps the bottom-right corner. This pairing recurs everywhere (home, community, feed,
reading circle) — treat avatar+soul as one unit.

### Book cover (three ways)
1. **Real image** — `bk_*.png` assets, `object-fit:cover`, asymmetric radius, brown spine shadow.
2. **3D hero book** — `.book-3d` with `rotateY(-21deg)`, page edges, sheen, contact shadow
   (home hero).
3. **Generative cover** — `.bcover` using CSS vars `--bg` / `--ink`, Lora uppercase title,
   diamond glyph, author — for shelves of many books without art.

### Wooden shelf plank
Recurs as the shelf metaphor: a thin plank (`linear-gradient(180deg,#CDA268,#B5854C,#9C6E3A)`
with grain + drop edge) that books "sit" on with a contact shadow. Light version in `.lib-plank`,
glowing dark version in `.shelf-plank`.

### Tabbar (5 tabs)
Sticky bottom, frosted (`rgba(250,248,243,0.86)` + `backdrop-filter: blur(18px)`), 5-col grid:
Home · Shelf · Scan · Community · Profile. Active item = amber stroke + 800 label; inactive =
Mute. Dark screens use `.tabbar.dark`. Icons are 24px stroke icons (see §6); active stroke
width is heavier than inactive.

---

## 6. Iconography

- **Custom inline SVG stroke icons**, `viewBox="0 0 24 24"`, `fill="none"`,
  `stroke-width: 1.8` (UI) or a passed `sw` (tabbar toggles ~2.4 active / 1.8 inactive),
  `stroke-linecap/linejoin: round`. Color passed as a prop (`c`) — usually Ink, Mute, Amber,
  or white. Keep them simple/geometric; match the existing `Icon` set in `home.jsx` (bell,
  search, play, arrow, home, shelf, discover, camera, community, profile).
- **Emoji** are used intentionally as content (soul animals 🦊🦅🐺, stat glyphs, goal icons,
  genre chips). This is on-brand here — keep emoji for playful "soul/mood" content, but use
  SVG stroke icons for functional UI (nav, search, actions).
- Don't introduce a third icon style or an icon font. Don't hand-draw complex illustrative SVGs.

---

## 7. Imagery & assets (already in project)

- Avatars: `av_me/maya/leo/noor/priya/sam/theo.png` — round, white-ringed.
- Book covers: `bk_acotar/babel/ironflame.png`, plus `cover.png`.
- Wordmark/logo: `logo_fable.png` (shown in the welcome emblem, radius 38, white tile).
- Need an image we don't have? Use a **striped placeholder** (subtle tonal stripes) with a
  monospace label of what goes there — never generate a fake illustration.

---

## 8. Voice & copy

Warm, encouraging, literary-but-friendly. Short. Celebrates progress ("12 books this year",
"Day 7 streak 🔥"). Uses the reading metaphor sincerely (shelves, souls, circles, sanctuary).
Numbers are concrete, not invented filler. Never corporate, never hype-y.

---

## 9. Checklist before you ship a screen

- [ ] Wrapped in `<IOSDevice width={393} height={852}>`; root is `.screen` (+ modifier).
- [ ] Background is Paper `#FAF8F3` (or the approved gradient); no pure white bg, no grey.
- [ ] Text uses Ink/Brown/Mute only; book titles & quotes are **Lora**, UI is **Nunito**.
- [ ] Accent is Amber `#E8A838` only; selected states follow the cream+amber recipe.
- [ ] Borders are `rgba(139,94,60,~0.12)` hairlines; shadows are brown-tinted & soft.
- [ ] Radii match §4; lists use flex/grid `gap`, not sibling margins.
- [ ] Avatars have white rings (+ soul badge where a person is shown).
- [ ] Sticky 5-tab `.tabbar` present (unless it's a modal/onboarding/camera flow).
- [ ] New CSS added to `app.css` under a labeled section; no `const styles` collisions.
- [ ] Functional icons are 24px round-stroke SVGs; emoji only for soul/mood content.
