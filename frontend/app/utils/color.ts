// Color palette helper shared by charts & legends
export function colorAt(i: number, dark: boolean): string {
  const paletteLight = [
    '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#14b8a6', '#f97316', '#22c55e', '#3b82f6', '#e11d48'
  ];
  const paletteDark = [
    '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
    '#2dd4bf', '#fb923c', '#4ade80', '#93c5fd', '#fb7185'
  ];
  const p = dark ? paletteDark : paletteLight;
  return p[i % p.length];
}