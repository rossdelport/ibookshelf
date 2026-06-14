// ─────────────────────────────────────────────────────────────────────────────
// Fable design tokens — ported from the Food Mood design system (its handoff
// README + theme.ts), adapted for a books/reading app. This is the single source
// of truth: screens import from here, never hardcode hexes or font names.
//
// Identity: warm off-white paper, charcoal-navy primary, Outfit (UI) + Newsreader
// (italic editorial only). Light theme ships; dark tokens are defined for later.
// Body type is intentionally a notch larger than Food Mood's for readability.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  bg: '#FAF8F4',          // warm off-white screen background
  bgGrad1: '#FAF8F4',     // subtle paper gradient (top → bottom)
  bgGrad2: '#F4EFE7',
  card: '#FFFFFF',        // cards, sheets, fields
  chip: '#F0ECE3',        // chips, pills, icon wells, inset surfaces
  chipDeep: '#E7E1D5',    // pressed/secondary chip
  line: 'rgba(60,48,36,0.10)',   // hairline borders / dividers
  lineStrong: 'rgba(60,48,36,0.16)',

  ink1: '#2A2622',        // primary text / headings
  ink2: '#6C645A',        // secondary text
  ink3: '#9C9288',        // muted text / captions / placeholders

  accent: '#232A33',      // charcoal-navy primary (buttons, active states)
  accentText: '#F3EFE9',  // text on accent
  accentSoft: '#EBEAE7',  // tonal accent wash (selected chip bg)

  // ── Fable extensions (kept minimal + on-palette) ──────────────────────────
  star: '#2A2622',        // filled star = ink1; empty uses `line`
  success: '#5E7257',     // "owned" / finished — muted sage (Food Mood calm hue)
  successSoft: '#E7EDE3',
  danger: '#B3503F',      // delete / destructive — warm muted brick
  dangerSoft: '#F3E4E0',
  white: '#FFFFFF',
};

export const darkColors = {
  bg: '#191715',
  card: '#232120',
  chip: '#2B2825',
  chipDeep: '#332F2B',
  line: 'rgba(255,255,255,0.09)',
  lineStrong: 'rgba(255,255,255,0.16)',
  ink1: '#F1ECE4',
  ink2: '#B6AEA3',
  ink3: '#837B71',
  accent: '#232A33',
  accentText: '#F3EFE9',
  accentSoft: '#2B2F36',
  star: '#F1ECE4',
  success: '#9DB495',
  successSoft: '#263023',
  danger: '#D08A7E',
  dangerSoft: '#3A2521',
  white: '#FFFFFF',
};

// Corner radii. Base 6; specific surfaces add to it (Food Mood scale).
export const radius = {
  base: 6,
  chip: 10,
  card: 12,
  button: 14,
  lg: 18,
  sheet: 26,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
  screen: 22, // default horizontal screen padding
};

// Brand fonts. Each weight is a distinct loaded family (RN custom fonts have no
// numeric weight). Outfit = UI sans; Newsreader = serif italic (editorial only).
export const fonts = {
  extralight: 'Outfit_200ExtraLight',
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifItalicMedium: 'Newsreader_500Medium_Italic',
};

// Semantic type presets (size + metrics only — pair with a `fonts.*` family and
// a `colors.*` color at the call site). Sizes run ~1.5–2px larger than Food Mood
// for readability, per the brief to enlarge description text app-wide.
export const type = {
  eyebrow: { fontSize: 11.5, letterSpacing: 2.4 },        // UPPERCASE · ink3 · medium
  // ── Canonical screen header pair — use these for EVERY screen's H1 + intro,
  //    onboarding and main app alike, so titles/descriptions stay consistent:
  hero: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },   // ← STANDARD screen title (H1), fonts.light
  bodyLg: { fontSize: 17, lineHeight: 26 },                      // ← STANDARD screen description/subtitle, fonts.regular · ink3
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },  // smaller title variant (tight headers)
  titleSm: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  section: { fontSize: 19, lineHeight: 25, letterSpacing: -0.2 }, // section/card headers
  cardTitle: { fontSize: 16.5, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontSize: 15.5, lineHeight: 23 },    // default body
  bodySm: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 16, letterSpacing: 0.2 }, // button labels
  editorial: { fontSize: 17, lineHeight: 26 }, // Newsreader italic lines
  stat: { fontSize: 22, letterSpacing: -0.3 },
  tab: { fontSize: 10.5, letterSpacing: 0.2 },
};

// Shadow recipes (charcoal-tinted; soft). Spread via `...shadow.card`.
export const shadow = {
  button: {
    shadowColor: '#1F2733',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 6,
  },
  card: {
    shadowColor: '#3C3024',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardSoft: {
    shadowColor: '#3C3024',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sheet: {
    shadowColor: '#1F2733',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
};

// The map passed to useFonts() in app/_layout.tsx. Kept here so the font list
// lives next to the token that names each family.
export { default as fontMap } from './fontMap';
