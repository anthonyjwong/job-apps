"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "../providers/ThemeProvider";
import ThemeToggle from "../theme-toggle";

export default function Header() {
  const { dark: darkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  const theme = {
    appBg: darkMode ? '#232326' : '#fff',
    border: darkMode ? '#333' : '#ddd',
    text: darkMode ? '#f3f3f3' : '#222',
    link: darkMode ? '#cbd5e1' : '#222',
    linkActive: darkMode ? '#90cdf4' : '#1976d2',
    pill: darkMode ? '#121214' : '#f3f4f6',
  } as const;

  const baseLink: React.CSSProperties = { color: theme.link, textDecoration: 'none', padding: '6px 10px', borderRadius: 8 };
  const activeLink: React.CSSProperties = { ...baseLink, color: theme.linkActive, background: theme.pill, border: `1px solid ${theme.border}` };

  if (!mounted) {
    // Render minimal shell to keep SSR/CSR markup stable
    return <header style={{ height: 56 }} />;
  }

  return (
    <header style={{ borderBottom: `1px solid ${theme.border}`, padding: '10px 0', background: theme.appBg, color: theme.text, position: 'sticky', top: 0, zIndex: 20, boxShadow: darkMode ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 700, marginRight: 8 }}>Job Apps</span>
            <Link href="/" style={pathname === '/' ? activeLink : baseLink}>Home</Link>
            <Link href="/jobs" style={pathname?.startsWith('/jobs') ? activeLink : baseLink}>Jobs</Link>
            <Link href="/approval" style={pathname?.startsWith('/approval') ? activeLink : baseLink}>Approvals</Link>
            <Link href="/apps" style={pathname?.startsWith('/apps') ? activeLink : baseLink}>Apps</Link>
            <Link href="/dev" style={pathname?.startsWith('/dev') ? activeLink : baseLink}>Dev</Link>
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
