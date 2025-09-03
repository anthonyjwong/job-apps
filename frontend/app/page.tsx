"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PieChart from "./components/PieChart";
import { useTheme } from "./providers/ThemeProvider";

type JobsSummary = {
  total_jobs: number;
  classifications: { safety: number; target: number; reach: number; dream: number };
  base_urls: Record<string, number>;
};

type AppsSummary = {
  total_apps: number;
  discarded: number;
  submitted: number;
  acknowledged: number;
  rejected: number;
};

export default function Home() {
  const { dark: darkMode } = useTheme();
  const [jobs, setJobs] = useState<JobsSummary | null>(null);
  const [apps, setApps] = useState<AppsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = "http://localhost:8000";
    const load = async () => {
      try {
        const [j, a] = await Promise.all([
          fetch(`${base}/jobs/summary`).then((r) => r.json()),
          fetch(`${base}/apps/summary`).then((r) => r.json()),
        ]);
        setJobs(j.data);
        setApps(a.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load stats");
      }
    };
    load();
  }, []);

  const theme = {
    background: darkMode ? '#18181b' : '#f9f9f9',
    appBg: darkMode ? '#232326' : '#fff',
    border: darkMode ? '#333' : '#ddd',
    text: darkMode ? '#f3f3f3' : '#222',
    link: darkMode ? '#90cdf4' : '#1976d2',
  } as const;

  return (
    <main style={{ padding: 16, maxWidth: 1000, margin: "0 auto", background: theme.background, color: theme.text, minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 12 }}>Job Apps Dashboard</h1>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/approval" style={btn(theme, darkMode)}>Approval</Link>
        <Link href="/jobs" style={btn(theme, darkMode)}>Job listings</Link>
      </nav>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={cardRow}>
        <div style={card(theme)}>
          <h3 style={cardTitle}>Jobs</h3>
          {jobs ? (
            <ul style={list(theme)}>
              <li>Total: {jobs.total_jobs}</li>
              <li>Safety: {jobs.classifications.safety}</li>
              <li>Target: {jobs.classifications.target}</li>
              <li>Reach: {jobs.classifications.reach}</li>
              <li>Dream: {jobs.classifications.dream}</li>
            </ul>
          ) : (
            <p>Loading…</p>
          )}
        </div>

        <div style={card(theme)}>
          <h3 style={cardTitle}>Applications</h3>
          {apps ? (
            <ul style={list(theme)}>
              <li>Total: {apps.total_apps}</li>
              <li>Discarded: {apps.discarded}</li>
              <li>Submitted: {apps.submitted}</li>
              <li>Acknowledged: {apps.acknowledged}</li>
              <li>Rejected: {apps.rejected}</li>
            </ul>
          ) : (
            <p>Loading…</p>
          )}
        </div>
      </section>

      {jobs && jobs.base_urls && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Top Sources</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(180px, 1fr) 1fr',
            gap: 12,
            alignItems: 'center',
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 10,
            background: theme.appBg,
          }}>
            <div style={{ justifySelf: 'center' }}>
              <PieChart
                data={Object.entries(jobs.base_urls)
                  .slice(0, 8)
                  .map(([label, value]) => ({ label, value }))}
                size={200}
                thickness={20}
                dark={darkMode}
                ariaLabel="Top Sources by job count"
              />
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {Object.entries(jobs.base_urls).slice(0, 8).map(([host, count], i) => (
                <li key={host} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: colorAt(i, darkMode),
                      border: `1px solid ${darkMode ? '#000' : '#fff'}`,
                    }} />
                    <span style={{ color: theme.text }}>{host}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

const btn = (theme: any, darkMode: boolean): React.CSSProperties => ({
  display: "inline-block",
  padding: "8px 12px",
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  background: darkMode ? '#232326' : '#fff',
  color: theme.text,
});

const cardRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const card = (theme: any): React.CSSProperties => ({
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: 12,
  background: theme.appBg,
});

const cardTitle: React.CSSProperties = { marginTop: 0 };

const list = (theme: any): React.CSSProperties => ({ margin: 0, paddingLeft: 18, color: theme.text });

const pill = (theme: any, darkMode: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: `1px solid ${theme.border}`,
  borderRadius: 999,
  padding: "8px 12px",
  background: darkMode ? '#232326' : '#fff',
  color: theme.text,
});

// Palette helper to keep legend colors aligned with the chart
function colorAt(i: number, dark: boolean): string {
  const paletteLight = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#22c55e",
    "#3b82f6",
    "#e11d48",
  ];
  const paletteDark = [
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#2dd4bf",
    "#fb923c",
    "#4ade80",
    "#93c5fd",
    "#fb7185",
  ];
  const p = dark ? paletteDark : paletteLight;
  return p[i % p.length];
}
