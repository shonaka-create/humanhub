import type { Tone } from './types';

// Resolves a tone to the matching CSS-variable palette + the darker text shade
// the design uses inside filled blocks/chips.
export const toneStyles: Record<Tone, { soft: string; strong: string; darkText: string }> = {
  accent: { soft: 'var(--accent-soft)', strong: 'var(--accent)', darkText: '#6E5142' },
  sage: { soft: 'var(--sage-soft)', strong: 'var(--sage)', darkText: '#4F5B4C' },
  rose: { soft: 'var(--rose-soft)', strong: 'var(--rose)', darkText: '#8A4E47' },
};
