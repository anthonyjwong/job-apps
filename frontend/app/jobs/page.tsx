"use client";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../providers/ThemeProvider";

type Review = {
  action?: string;
  classification?: "safety" | "target" | "reach" | "dream" | null;
} | null;

type Classification = "safety" | "target" | "reach" | "dream";

type JobRecord = {
  id: string;
  jobspy_id: string;
  title: string;
  company: string;
  location?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  date_posted?: string | null;
  job_type?: string | null;
  linkedin_job_url?: string | null;
  direct_job_url?: string | null;
  description?: string | null;
  review?: Review;
  reviewed?: boolean;
  approved?: boolean;
  discarded?: boolean;
};

export default function AllJobsPage() {
  const { dark: darkMode } = useTheme();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/jobs", {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      setJobs(json.jobs || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchJobs();
      setLoading(false);
    })();
  }, [fetchJobs]);

  const theme = {
    background: darkMode ? '#18181b' : '#f9f9f9',
    appBg: darkMode ? '#232326' : '#fff',
    border: darkMode ? '#333' : '#ddd',
    text: darkMode ? '#f3f3f3' : '#222',
    link: darkMode ? '#90cdf4' : '#1976d2',
    muted: darkMode ? '#9ca3af' : '#6b7280',
    approveBg: darkMode ? '#166534' : '#22c55e',
    discardBg: darkMode ? '#7f1d1d' : '#ef4444',
    btnText: '#fff',
  } as const;

  // Badge colors for review classifications (dark/light aware)
  const classificationColors: Record<Classification, { bg: string; text: string; border: string }> = {
    safety: {
      bg: darkMode ? '#134e4a' : '#dcfce7',
      text: darkMode ? '#a7f3d0' : '#065f46',
      border: darkMode ? '#115e59' : '#86efac',
    },
    target: {
      bg: darkMode ? '#1e3a8a' : '#dbeafe',
      text: darkMode ? '#93c5fd' : '#1e40af',
      border: darkMode ? '#1d4ed8' : '#93c5fd',
    },
    reach: {
      bg: darkMode ? '#7c2d12' : '#ffedd5',
      text: darkMode ? '#fdba74' : '#9a3412',
      border: darkMode ? '#9a3412' : '#fdba74',
    },
    dream: {
      bg: darkMode ? '#4c1d95' : '#f3e8ff',
      text: darkMode ? '#d8b4fe' : '#6b21a8',
      border: darkMode ? '#6b21a8' : '#d8b4fe',
    },
  };

  const renderClassification = (c?: Classification | null) => {
    if (!c) return null;
    const colors = classificationColors[c];
    const label = c.charAt(0).toUpperCase() + c.slice(1);
    return (
      <span
        aria-label={`Classification ${label}`}
        title={`Classification: ${label}`}
        style={{
          display: 'inline-block',
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 999,
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          lineHeight: 1.6,
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    );
  };

  if (loading) return <main style={{ padding: 16, background: theme.background, color: theme.text, minHeight: '100vh' }}>Loading…</main>;
  if (error) return <main style={{ padding: 16, color: "red", background: theme.background, minHeight: '100vh' }}>Error: {error}</main>;

  const clean = (s?: string | null) => (s ? s.replace(/\s+/g, ' ').trim() : '');
  const snippet = (s?: string | null, n = 500) => {
    const c = clean(s);
    return c.length > n ? c.slice(0, n) + '…' : c;
  };
  const bestLink = (j: JobRecord) => j.direct_job_url || j.linkedin_job_url || undefined;

  const approveJob = async (j: JobRecord) => {
    try {
      const res = await fetch(`http://localhost:8000/job/${j.id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const t = await res.text();
        alert(`Failed to approve job: ${t}`);
        return;
      }
  // Optimistic UI update, then refresh from server for consistency
  setJobs(prev => prev.map(x => x.id === j.id ? { ...x, approved: true } : x));
  void fetchJobs();
    } catch (e) {
      alert(`Network error approving job: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  };

  const discardJob = async (j: JobRecord) => {
    try {
    const res = await fetch(`http://localhost:8000/job/${j.id}/discard`, { method: 'POST' });
      if (!res.ok) {
        const t = await res.text();
        alert(`Failed to discard job: ${t}`);
        return;
      }
  // Optimistic UI update, then refresh from server for consistency
  setJobs(prev => prev.map(x => x.id === j.id ? { ...x, discarded: true } : x));
  void fetchJobs();
    } catch (e) {
      alert(`Network error discarding job: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto", background: theme.background, color: theme.text, minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>All Jobs</h1>
        <div
          aria-label={`Total jobs: ${jobs.length}`}
          title={`Total jobs: ${jobs.length}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            padding: '2px 10px',
            borderRadius: 999,
            background: theme.appBg,
            color: theme.muted,
            border: `1px solid ${theme.border}`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: theme.text, fontWeight: 600 }}>{jobs.length}</span>
          <span style={{ textTransform: 'none' }}>{jobs.length === 1 ? 'job' : 'jobs'}</span>
        </div>
      </header>
      {jobs.length === 0 ? (
        <p>No jobs yet.</p>
      ) : (
        <section style={{ display: 'grid', gap: 12 }}>
          {jobs.map((j) => (
            <article key={j.id} style={{
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              background: theme.appBg,
              padding: 12,
              opacity: j.discarded ? 0.6 : 1,
            }}>
              <header style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                  {bestLink(j) ? (
                    <a href={bestLink(j)} target="_blank" rel="noreferrer" style={{ color: theme.link, textDecoration: 'underline' }}>
                      {j.title}
                    </a>
                  ) : (
                    <span>{j.title}</span>
                  )}
                  </h3>
                  <div style={{ color: theme.muted, fontSize: 14 }}>
                    {j.company}{j.location ? ` • ${j.location}` : ''}{j.job_type ? ` • ${j.job_type}` : ''}
                    {j.approved ? ' • approved' : ''}{j.discarded ? ' • discarded' : ''}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {renderClassification(j.review?.classification ?? null)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => approveJob(j)}
                    title="Approve (create application)"
                    aria-label={`Approve ${j.title}`}
                    disabled={!!j.approved || j.discarded}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: theme.approveBg,
                      color: theme.btnText,
                      cursor: j.approved || j.discarded ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => discardJob(j)}
                    title="Discard job"
                    aria-label={`Discard ${j.title}`}
                    disabled={!!j.discarded}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: theme.discardBg,
                      color: theme.btnText,
                      cursor: j.discarded ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </header>
              {j.description ? (
                <p style={{ marginTop: 8, marginBottom: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{snippet(j.description, 700)}</p>
              ) : (
                <p style={{ marginTop: 8, marginBottom: 0, color: theme.muted }}>(No description provided)</p>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
