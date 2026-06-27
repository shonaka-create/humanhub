'use client';

import type { CSSProperties } from 'react';
import { toneStyles } from '@/lib/tones';
import type { Tone } from '@/lib/types';

export function Card({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '22px 24px',
        boxShadow: '0 1px 2px rgba(46,42,37,.04)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Avatar({
  initial,
  tone,
  size = 32,
  solid = false,
}: {
  initial: string;
  tone: Tone;
  size?: number;
  solid?: boolean;
}) {
  const ts = toneStyles[tone];
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        background: solid ? ts.strong : ts.soft,
        color: solid ? '#fff' : ts.strong,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--serif)',
        fontSize: Math.round(size * 0.42),
      }}
    >
      {initial}
    </div>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: 0, ...style }}>{children}</h2>
  );
}
