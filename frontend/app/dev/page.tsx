"use client";
import React, { useEffect, useState } from 'react';
import PieChart from '../components/PieChart';
import { useTheme } from '../providers/ThemeProvider';
import { colorAt } from '../utils/color';

export default function DevPage() {
  const { dark: darkMode } = useTheme();
  const [approvedNoAppSources, setApprovedNoAppSources] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:8000" as const;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/apps/summary`);
        const json = await res.json();
        const approvedNoApp = json?.data?.approved_without_app;
        setApprovedNoAppSources(approvedNoApp?.base_urls || {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
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
  const muted = darkMode ? '#9ca3af' : '#6b7280';

  if (loading) {
    return <main style={{ padding: 16, background: theme.background, color: theme.text }}>Loading…</main>;
  }
  if (error) {
    return <main style={{ padding: 16, background: theme.background, color: 'red' }}>{error}</main>;
  }

  const entries = Object.entries(approvedNoAppSources).slice(0, 8);
  const total = entries.reduce((acc, [, v]) => acc + (typeof v === 'number' ? v : 0), 0);

  return (
    <main style={{ padding: 16, background: theme.background, color: theme.text, minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 12 }}>Top Site Sources</h2>
      {entries.length === 0 || total === 0 ? (
        <div style={{
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 12,
          background: theme.appBg,
          color: muted,
          textAlign: 'center',
        }}>
          No source data yet.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(160px, 1fr) 1fr',
          gap: 12,
          alignItems: 'center',
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 10,
          background: theme.appBg,
        }}>
          <div style={{ justifySelf: 'center' }}>
            <PieChart
              data={entries.map(([label, value]) => ({ label, value }))}
              size={180}
              thickness={18}
              dark={darkMode}
              ariaLabel="Top Sources by job count"
            />
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {entries.map(([host, count], i) => (
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
      )}
    </main>
  );
}
