# Fable – Design System & Build Spec

> Read this before building or editing any screen. **Golden rule: import tokens from
> [`constants/theme.ts`](constants/theme.ts) — never hardcode a hex, font name, radius, or
> shadow.** When something isn't covered here, derive it from the nearest token; don't freestyle.
>
> This system was migrated to match the sister app **Food Mood** (warm paper, charcoal-navy
> primary, Outfit + Newsreader). The previous amber/Lora "cozy" identity is retired.

---

## 0. The vibe in one sentence
Calm, premium, literary-but-minimal — warm off-white paper, charcoal-navy primary, quiet
ink-brown text, generous whitespace, soft charcoal-tinted shadows. Outfit (UI) + Newsreader
(serif italic, editorial accents only). Not cozy-amber, not neon, not tech-cold.

---

## 1. Source of truth
All tokens live in [`constants/theme.ts`](constants/theme.ts): `colors`, `radius`, `spacing`,
`fonts`, `type`, `shadow`. Fonts are loaded once in [`app/_layout.tsx`](app/_layout.tsx) via
`useFonts(fontMap)` with a splash gate. Light theme ships; `darkColors` is defined for later
(not wired). Build screens with React Native primitives + `StyleSheet`, composing token presets:
`{ ...type.body, fontFamily: fonts.regular, color: colors.ink2 }`.

---

## 2. Color tokens (`colors`)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#FAF8F4` | screen background (warm off-white) |
| `card` | `#FFFFFF` | cards, sheets, fields |
| `chip` | `#F0ECE3` | chips, pills, icon wells, inset surfaces |
| `line` | `rgba(60,48,36,0.10)` | hairline borders / dividers |
| `ink1` | `#2A2622` | primary text / headings |
| `ink2` | `#6C645A` | secondary text |
| `ink3` | `#9C9288` | muted text / captions / placeholders |
| `accent` | `#232A33` | charcoal-navy primary (buttons, active states, selected ring) |
| `accentText` | `#F3EFE9` | text/icon on accent |
| `success` | `#5E7257` | "owned"/finished (muted sage) · `successSoft` bg |
| `danger` | `#B3503F` | destructive (delete) · `dangerSoft` bg |

Neutrals carry warmth, never grey. Pure white appears only as `card`. Selected/active states use
`accent` (charcoal), not a colored accent — let **book covers** provide the color in the UI.

---

## 3. Typography
Two families only (`fonts`):
- **Outfit** (sans) — all UI, incl. book titles. Weights: `light` (300, big titles), `regular`
  (400), `medium` (500, labels/buttons), `semibold` (600). `extralight` (200) for hero numerals.
- **Newsreader** (`serifItalic` / `serifItalicMedium`) — *italic only*, reserved for editorial /
  emotional lines (hero quotes, empty-state lines, "insight" copy). Never for plain UI or labels.

### Canonical scale (`type`) — keep sizes consistent across onboarding AND main screens
| Preset | Size / metrics | Family | Use |
|---|---|---|---|
| **`hero`** | **32 / lh 38 / -0.5** | **`fonts.light`** | **STANDARD screen title (H1) — every screen** |
| **`bodyLg`** | **17 / lh 26** | **`fonts.regular`** (ink3) | **STANDARD screen description / subtitle — every screen** |
| `title` | 28 / lh 34 | light | tighter inline title variant |
| `titleSm` | 24 / lh 30 | light/regular | compact headers |
| `section` | 19 / lh 25 | semibold | section / card-group headers |
| `cardTitle` | 16.5 / lh 22 | medium | card + row titles, book titles |
| `body` | 15.5 / lh 23 | regular | default body text |
| `bodySm` | 14 / lh 20 | regular | dense secondary text |
| `caption` | 13 / lh 18 | medium/regular (ink3) | metadata, captions |
| `eyebrow` | 11.5 / ls 2.4 | medium (ink3) | UPPERCASE section labels |
| `label` | 16 | semibold | button labels |
| `editorial` | 17 / lh 26 | `serifItalic` | Newsreader italic lines only |

> **Title/description rule:** a screen's H1 is `fonts.light` + `type.hero`; its intro line is
> `fonts.regular` + `type.bodyLg` in `ink3`. Don't invent per-screen title sizes.

---

## 4. Shape, spacing, motion
- **Radii (`radius`):** `chip` 10 · `card` 12 · `button` 14 · `lg` 18 · `sheet` 26 · `pill` 999.
  (Tighter than the old system — keep them tight.)
- **Spacing (`spacing`):** xs 4 · sm 8 · md 16 · lg 24 · xl 32; default screen H-padding `22`.
- **Shadows (`shadow`):** `button` (charcoal, soft + deep), `card` / `cardSoft` (subtle brown),
  `sheet`. Always charcoal/brown-tinted, never neutral black.
- **Motion:** subtle. Press `scale(0.96)` / `translateY(-1px)`; sheets rise with
  `cubic-bezier(0.22,1,0.36,1)`. Tasteful **haptics** on selections/confirm (`expo-haptics`,
  Light for taps, Medium for primary CTA). Respect reduced motion.

---

## 5. Core components
- **Primary button (CTA):** full-width, `colors.accent` bg, `accentText` label
  (`fonts.semibold` + `type.label`), `radius.button`, `...shadow.button`, ~18px vertical pad.
  Disabled = `chip` bg + `ink3` text, no shadow. Ghost = `card` bg, `ink1` text, hairline border.
- **Chip / pill:** `chip` bg, `ink2` text, `pill` radius. **On** = `accent` fill + `accentText`.
- **Segmented control:** `chip` track, 4px pad, `pill`; active segment = `accent` fill + `accentText`.
- **Card / row:** `card` surface, hairline `line` border, `shadow.cardSoft`, `radius.card`.
  Selected = `accentSoft` fill + `1.5px accent` border.
- **Color swatch:** circle; selected = `2.5px accent` ring + `shadow.cardSoft`. (Default ~35px.)
- **Avatar:** procedural [`AvatarFace`](components/AvatarFace.tsx) — skin/hairStyle(0–5)/hairColor/
  shirtColor, scales from a 128 reference. Pair with the soul-animal emoji badge where a person shows.
- **Onboarding chrome:** back = `chip` circle w/ chevron; progress = thin segments (`accent` filled,
  `line` empty); footer = primary CTA. Titles centered or left per screen, using the §3 pair.

---

## 6. Iconography
Thin geometric stroke icons (existing `components/icons.tsx`), 1.8–2.4 stroke, round caps, color
via prop (ink/accent/white). Emoji only for soul-animal / playful content, never functional UI.

---

## 7. Voice & copy
Calm, warm, literary, encouraging, concrete. Short. Celebrates reading progress honestly. No
gamification hype, no corporate tone. **No em dashes (—) in user-facing copy** — use periods/commas.

---

## 8. Checklist before shipping a screen
- [ ] All tokens imported from `constants/theme.ts`; no hardcoded hexes/fonts/radii/shadows.
- [ ] Background `colors.bg`; pure white only as `card`; text is ink1/2/3.
- [ ] H1 = `fonts.light` + `type.hero`; description = `fonts.regular` + `type.bodyLg` (ink3).
- [ ] Book titles + UI in **Outfit**; Newsreader italic only for editorial lines.
- [ ] Accent/active states use `colors.accent` (charcoal); selected card = `accentSoft` + accent border.
- [ ] Radii from `radius`; lists use flex `gap`, not sibling margins.
- [ ] Tasteful haptics on selections + CTA; press scale on interactive elements.
