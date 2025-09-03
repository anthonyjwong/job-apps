"use client";
import Link from "next/link";
import { useTheme } from "../providers/ThemeProvider";
import ThemeToggle from "../theme-toggle";

export default function Header() {
  const { dark: darkMode } = useTheme();

  const theme = {
    appBg: darkMode ? '#232326' : '#fff',
    border: darkMode ? '#333' : '#ddd',
    text: darkMode ? '#f3f3f3' : '#222',
    link: darkMode ? '#cbd5e1' : '#222',
    linkActive: darkMode ? '#90cdf4' : '#1976d2',
  } as const;

  const linkStyle: React.CSSProperties = {
    color: theme.link,
    textDecoration: 'none',
  };

  return (
    <header style={{ borderBottom: `1px solid ${theme.border}`, padding: '10px 16px', background: theme.appBg, color: theme.text }}>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" style={linkStyle}>Home</Link>
          <Link href="/approval" style={linkStyle}>Approval</Link>
          <Link href="/jobs" style={linkStyle}>Jobs</Link>
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}
