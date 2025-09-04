"use client";
import { useEffect, useState } from "react";
import PieChart from "./components/PieChart";
import { UnimplementedContainer } from "./components/UnimplementedContainer";
import { useTheme } from "./providers/ThemeProvider";

type JobsSummary = {
  total_jobs: number;
  classifications: { safety: number; target: number; reach: number; dream: number; unreviewed?: number };
  base_urls: Record<string, number>;
};

type AppsSummary = {
  total_apps: number;
  discarded: number;
  submitted: number;
  acknowledged: number;
  rejected: number;
  approved_without_app?: {
    count: number;
    base_urls: Record<string, number>;
  };
};

type AppliedApp = {
  app_id: string;
  job_id: string;
  company: string;
  title: string;
  submitted: boolean;
  acknowledged: boolean;
  rejected: boolean;
};

export default function Home() {
  const { dark: darkMode } = useTheme();
  const [jobs, setJobs] = useState<JobsSummary | null>(null);
  const [apps, setApps] = useState<AppsSummary | null>(null);
  const [unapprovedJobsCount, setUnapprovedJobsCount] = useState<number | null>(null);
  const [unapprovedAppsCount, setUnapprovedAppsCount] = useState<number | null>(null);
  const [appliedApps, setAppliedApps] = useState<AppliedApp[]>([]);
  const [approvedNoAppCount, setApprovedNoAppCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [approvedNoAppSources, setApprovedNoAppSources] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const base = "http://localhost:8000";
    const load = async () => {
      try {
        const [jobs_summary, apps_summary, unapproved_jobs, unapproved_apps, applied_apps] = await Promise.all([
          fetch(`${base}/jobs/summary`).then((r) => r.json()),
          fetch(`${base}/apps/summary`).then((r) => r.json()),
          fetch(`${base}/jobs`).then((r) => r.json()), // unapproved jobs list
          fetch(`${base}/apps/unapproved`).then((r) => r.json()), // prepared but unapproved/undiscarded
          fetch(`${base}/apps/applied`).then((r) => r.json()), // submitted apps with company/title/status
        ]);
        setJobs(jobs_summary.data);
        setApps(apps_summary.data);
        setUnapprovedJobsCount(Array.isArray(unapproved_jobs.jobs) ? unapproved_jobs.jobs.length : 0);
        setUnapprovedAppsCount(Array.isArray(unapproved_apps.apps) ? unapproved_apps.apps.length : 0);
        setAppliedApps(Array.isArray(applied_apps.apps) ? applied_apps.apps : []);
        const approvedNoApp = apps_summary?.data?.approved_without_app;
        setApprovedNoAppCount(typeof approvedNoApp?.count === 'number' ? approvedNoApp.count : 0);
        setApprovedNoAppSources(approvedNoApp?.base_urls || {});
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
  const muted = darkMode ? '#9ca3af' : '#6b7280';

  if (!mounted) {
    // Keep SSR and CSR markup consistent; render a minimal shell
    return <main style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }} />;
  }

  return (
    <main style={{ padding: 16, maxWidth: 1000, margin: "0 auto", background: theme.background, color: theme.text, minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 12 }}>Job Apps Dashboard</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={cardRow}>
        <div style={card(theme)}>
          <h3 style={cardTitle}>Jobs</h3>
          <div style={{ fontSize: 12, color: muted, marginTop: -6, marginBottom: 8 }}>Summary</div>
          {jobs ? (
            <div>
              <ul style={list(theme)}>
                {typeof jobs.classifications.unreviewed === 'number' && (
                  <li>Unclassified: {jobs.classifications.unreviewed}</li>
                )}
                {typeof unapprovedJobsCount === 'number' && (
                  <li>In discovery queue: {unapprovedJobsCount}</li>
                )}
              </ul>
              {jobs && (
                <section style={{ marginTop: 24 }}>
                  {(() => {
                    const cls = jobs.classifications;
                    const items = [
                      { label: 'Safety', value: cls.safety },
                      { label: 'Target', value: cls.target },
                      { label: 'Reach', value: cls.reach },
                      { label: 'Dream', value: cls.dream },
                      ...(typeof cls.unreviewed === 'number' ? [{ label: 'Unreviewed', value: cls.unreviewed }] : []),
                    ].filter(d => typeof d.value === 'number' && d.value > 0);
                    const total = items.reduce((a, b) => a + (isFinite(b.value) ? b.value : 0), 0);
                    if (items.length === 0 || total === 0) {
                      return (
                        <div style={{
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          padding: 16,
                          background: theme.appBg,
                          color: muted,
                          textAlign: 'center',
                        }}>
                          No classification data yet.
                        </div>
                      );
                    }
                    return (
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
                            data={items}
                            size={200}
                            thickness={20}
                            dark={darkMode}
                            ariaLabel="Classification distribution"
                          />
                        </div>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                          {items.map((item, i) => (
                            <li key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: 10,
                                  height: 10,
                                  borderRadius: 2,
                                  background: colorAt(i, darkMode),
                                  border: `1px solid ${darkMode ? '#000' : '#fff'}`,
                                }} />
                                <span style={{ color: theme.text }}>{item.label}</span>
                              </div>
                              <span style={{ fontWeight: 600 }}>{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </section>
              )}
            </div>
          ) : (
            <p>Loading…</p>
          )}
        </div>

        <div style={card(theme)}>
          <h3 style={cardTitle}>Applications</h3>
          <div style={{ fontSize: 12, color: muted, marginTop: -6, marginBottom: 8 }}>Summary</div>
          {apps ? (
            <div>
              <ul style={list(theme)}>
                {typeof unapprovedAppsCount === 'number' && (
                  <li style={{marginBottom: 24}}>In approval queue: {unapprovedAppsCount}</li>
                )}
                <li>Submitted: {apps.submitted}</li>
                <UnimplementedContainer as="li">
                  <p style={{ margin: 0 }}>Acknowledged: {apps.acknowledged}</p>
                  <p style={{ margin: 0 }}>Rejected: {apps.rejected}</p>
                </UnimplementedContainer>
                <li style={{marginTop: 24}}>Unprepared: {approvedNoAppCount}</li>
                {/* Top Sources pie chart inside Applications card as requested */}
        {approvedNoAppSources && Object.keys(approvedNoAppSources).length > 0 && (
                  <section>
                    <h4>Top Site Sources</h4>
                    {(() => {
          const entries = Object.entries(approvedNoAppSources).slice(0, 8);
                      const total = entries.reduce((acc, [, v]) => acc + (typeof v === 'number' ? v : 0), 0);
                      if (entries.length === 0 || total === 0) {
                        return (
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
                        );
                      }
                      return (
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
                      );
                    })()}
                  </section>
                )}
              </ul>
            </div>
          ) : (
            <p>Loading…</p>
          )}
        </div>
      </section>

      {/* Top Sources moved into Applications card */}

      {appliedApps && appliedApps.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Applied companies and status</h3>
          <div style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            background: theme.appBg,
            overflow: 'hidden',
          }}>
            {(() => {
              const grouped: Record<string, AppliedApp[]> = appliedApps.reduce((acc, a) => {
                const key = a.company || 'Unknown';
                (acc[key] ||= []).push(a);
                return acc;
              }, {} as Record<string, AppliedApp[]>);
              const toggle = (company: string) =>
                setExpandedCompanies((prev) => ({ ...prev, [company]: !prev[company] }));
              return (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {Object.entries(grouped).map(([company, items]) => {
                    if (items.length <= 1) {
                      const a = items[0];
                      const status = a.rejected ? 'Rejected' : a.acknowledged ? 'Acknowledged' : 'Submitted';
                      const color = a.rejected ? (darkMode ? '#b91c1c' : '#ef4444') : a.acknowledged ? (darkMode ? '#2563eb' : '#3b82f6') : (darkMode ? '#6b7280' : '#9ca3af');
                      const bg = a.rejected ? (darkMode ? '#3f1d1d' : '#fee2e2') : a.acknowledged ? (darkMode ? '#1e3a8a' : '#dbeafe') : (darkMode ? '#1f2937' : '#f3f4f6');
                      const border = a.rejected ? (darkMode ? '#7f1d1d' : '#fecaca') : a.acknowledged ? (darkMode ? '#1d4ed8' : '#bfdbfe') : (darkMode ? '#374151' : '#e5e7eb');
                      return (
                        <li key={a.app_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                              <span style={{ fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>{company}</span>
                              <span style={{ color: muted, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{a.title}</span>
                            </div>
                          </div>
                          <span style={{ alignSelf: 'center', fontSize: 12, padding: '2px 8px', borderRadius: 999, background: bg, color, border: `1px solid ${border}` }}>{status}</span>
                        </li>
                      );
                    }
                    const isOpen = !!expandedCompanies[company];
                    return (
                      <li key={company} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <button
                          onClick={() => toggle(company)}
                          aria-expanded={isOpen}
                          style={{
                            all: 'unset',
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '10px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          <span aria-hidden style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 120ms ease' }}>▸</span>
                          <span style={{ fontWeight: 700, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company}</span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 1,
                              fontSize: 12,
                              color: muted,
                              border: `1px solid ${theme.border}`,
                              borderRadius: 999,
                              padding: '3px 10px',
                              marginRight: 24,
                            }}
                          >
                            {items.length}
                          </span>
                        </button>
                        {isOpen && (
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0  }}>
                            {items.map((a) => {
                              const status = a.rejected ? 'Rejected' : a.acknowledged ? 'Acknowledged' : 'Submitted';
                              const color = a.rejected ? (darkMode ? '#b91c1c' : '#ef4444') : a.acknowledged ? (darkMode ? '#2563eb' : '#3b82f6') : (darkMode ? '#6b7280' : '#9ca3af');
                              const bg = a.rejected ? (darkMode ? '#3f1d1d' : '#fee2e2') : a.acknowledged ? (darkMode ? '#1e3a8a' : '#dbeafe') : (darkMode ? '#1f2937' : '#f3f4f6');
                              const border = a.rejected ? (darkMode ? '#7f1d1d' : '#fecaca') : a.acknowledged ? (darkMode ? '#1d4ed8' : '#bfdbfe') : (darkMode ? '#374151' : '#e5e7eb');
                              return (
                                <li key={a.app_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 12px', borderTop: `1px dashed ${theme.border}`, background: darkMode ? '#1d1d20' : '#fafafa' }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ color: muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                                  </div>
                                  <span style={{ alignSelf: 'center', fontSize: 12, padding: '2px 8px', borderRadius: 999, background: bg, color, border: `1px solid ${border}` }}>{status}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>
        </section>
      )}
    </main>
  );
}

type Theme = { border: string; text: string; appBg: string };

const btn = (theme: Theme, darkMode: boolean): React.CSSProperties => ({
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

const card = (theme: Theme): React.CSSProperties => ({
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: 12,
  background: theme.appBg,
});

const cardTitle: React.CSSProperties = { marginTop: 0 };

const list = (theme: Theme): React.CSSProperties => ({ margin: 0, paddingLeft: 18, color: theme.text });

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
