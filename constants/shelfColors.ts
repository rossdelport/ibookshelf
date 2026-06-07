// Curated, on-brand accent colours for custom shelves (DESIGN.md warm theme).
// Kept to a small set so a shelf colour can never clash with the cream/amber/ink
// look. `undefined` means "no colour set" and renders as the default ink chip —
// represented in the picker by the first swatch.

export const SHELF_DEFAULT = '#332C24'; // ink — the active-chip colour when none is chosen

export interface ShelfColor {
  label: string;
  value?: string; // undefined = default (ink)
}

export const SHELF_COLORS: ShelfColor[] = [
  { label: 'Default',    value: undefined },
  { label: 'Amber',      value: '#E8A838' },
  { label: 'Brown',      value: '#8B5E3C' },
  { label: 'Terracotta', value: '#B5654A' },
  { label: 'Sage',       value: '#5BA66E' },
  { label: 'Plum',       value: '#7A4A66' },
  { label: 'Teal',       value: '#2E6E6E' },
];

// The fill to use for a shelf's active chip / colour dot.
export function shelfChipColor(color?: string): string {
  return color ?? SHELF_DEFAULT;
}
