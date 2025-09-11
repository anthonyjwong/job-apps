"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

type Props = {
  darkMode: boolean;
  href: string;
  color: string; // base hex color like '#F7CF46'
  bigText: string; // primary line
  smallText: string; // subtitle line
  count?: number | null; // optional queue count to surface on the card
  ariaLabel?: string;
  title?: string;
};

function clamp(n: number, min = 0, max = 255) { return Math.max(min, Math.min(max, n)); }

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function adjustColor(hex: string, amt: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + amt, rgb.g + amt, rgb.b + amt);
}

function pickTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#0b0b0b';
  // perceived brightness
  const brightness = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  // Use softer off-white on dark backgrounds to avoid harsh contrast
  return brightness > 0.7 ? '#0b0b0b' : '#f3f4f6';
}

export default function ActionCard({ darkMode, href, color, bigText, smallText, count, ariaLabel, title }: Props) {
  const end = adjustColor(color, -14);
  const textColor = pickTextColor(color);
  const [displayCount, setDisplayCount] = useState<number>(typeof count === 'number' ? count : 0);

  // Animate the count when it changes
  useEffect(() => {
    const to = typeof count === 'number' ? count : 0;
    const from = displayCount;
    if (from === to) return;

    let rafId = 0;
    let start: number | null = null;
    const duration = 700; // ms
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = easeOutCubic(progress);
      const val = Math.round(from + (to - from) * eased);
      setDisplayCount(val);
      if (progress < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        role="link"
        aria-label={ariaLabel}
        title={title}
        style={{
          borderRadius: 6,
          padding: '25px',
          minHeight: 88,
          margin: '0 auto',
          background: `linear-gradient(135deg, ${color}, ${end})`,
          cursor: 'pointer',
          border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: darkMode ? '0 6px 18px rgba(0,0,0,0.35)' : '0 6px 18px rgba(0,0,0,0.10)',
          transition: 'transform 120ms ease',
        }}
        onMouseDown={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.99)'; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ margin: 0, fontSize: 20, lineHeight: 1.15, color: textColor, fontWeight: 800 }}>
              {bigText}
            </div>
            <div style={{ margin: 0, marginTop: 2, fontSize: 14, lineHeight: 1.3, color: textColor, opacity: 0.95, fontWeight: 600 }}>
              {smallText}
            </div>
          </div>
          {typeof count === 'number' && (
            <div style={{ textAlign: 'right', minWidth: 56, alignSelf: 'center' }}>
              <div style={{ margin: 0, fontSize: 28, lineHeight: 1, color: textColor, fontWeight: 900 }}>
                {displayCount}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
