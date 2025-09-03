"use client";
import { useTheme } from "./providers/ThemeProvider";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        background: dark ? '#232326' : '#fff',
        color: dark ? '#f3f3f3' : '#222',
        border: '1px solid #ddd',
        borderRadius: 999,
        padding: '6px 12px',
        cursor: 'pointer',
      }}
    >
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
