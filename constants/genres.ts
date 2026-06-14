// Canonical reading-genre list — shared by onboarding and the profile editor so
// the labels stored in profile.favouriteGenres always match.
export const GENRES: { label: string; emoji: string }[] = [
  { label: 'Fantasy', emoji: '📖' },
  { label: 'Romance', emoji: '💕' },
  { label: 'Business', emoji: '💼' },
  { label: 'Thriller', emoji: '✒️' },
  { label: 'Sci-Fi', emoji: '🚀' },
  { label: 'Cosy & Cottagecore', emoji: '🌿' },
  { label: 'Classic Literature', emoji: '🏛️' },
  { label: 'Horror', emoji: '😱' },
  { label: 'Mystery', emoji: '🔍' },
  { label: 'Young Adult', emoji: '✨' },
];

// Quick emoji lookup for rendering a saved genre label.
export const genreEmoji = (label: string) => GENRES.find((g) => g.label === label)?.emoji ?? '📚';
