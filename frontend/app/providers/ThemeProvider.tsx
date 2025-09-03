"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeCtx = {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with a deterministic value for SSR, then sync from localStorage after mount
  const [dark, setDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Read preference after mount to avoid SSR/CSR mismatches
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("theme");
      if (stored) setDark(stored === "dark");
    } catch {}
    setMounted(true);
  }, []);

  // Apply class and persist only after initial sync
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      window.localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }, [dark, mounted]);

  const value = useMemo<ThemeCtx>(() => ({
    dark,
    toggle: () => setDark((d) => !d),
    setDark,
  }), [dark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
