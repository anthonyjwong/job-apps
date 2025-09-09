"use client";

// ManualCreateModal moved outside Home for stable identity
import React, { useEffect, useState } from "react";
import PieChart from "./components/PieChart";
import { UnimplementedContainer } from "./components/UnimplementedContainer";
import { useTheme } from "./providers/ThemeProvider";
type ManualCreateModalProps = {
  show: boolean;
  onClose: () => void;
  manualUseDetails: boolean;
  setManualUseDetails: (v: boolean) => void;
  manualJobId: string;
  setManualJobId: (v: string) => void;
  manualUrl: string;
  setManualUrl: (v: string) => void;
  manualSubmitted: boolean;
  setManualSubmitted: (v: boolean) => void;
  manualJobTitle: string;
  setManualJobTitle: (v: string) => void;
  manualJobCompany: string;
  setManualJobCompany: (v: string) => void;
  manualJobLocation: string;
  setManualJobLocation: (v: string) => void;
  manualJobType: string;
  setManualJobType: (v: string) => void;
  manualLinkedinUrl: string;
  setManualLinkedinUrl: (v: string) => void;
  manualDirectUrl: string;
  setManualDirectUrl: (v: string) => void;
  manualMinSalary: string;
  setManualMinSalary: (v: string) => void;
  manualMaxSalary: string;
  setManualMaxSalary: (v: string) => void;
  manualDatePosted: string;
  setManualDatePosted: (v: string) => void;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  creating: boolean;
  onSubmit: () => void;
  darkMode: boolean;
  theme: Theme;
  muted: string;
};

function ManualCreateModal({
  show,
  onClose,
  manualUseDetails,
  setManualUseDetails,
  manualJobId,
  setManualJobId,
  manualUrl,
  setManualUrl,
  manualSubmitted,
  setManualSubmitted,
  manualJobTitle,
  setManualJobTitle,
  manualJobCompany,
  setManualJobCompany,
  manualJobLocation,
  setManualJobLocation,
  manualJobType,
  setManualJobType,
  manualLinkedinUrl,
  setManualLinkedinUrl,
  manualDirectUrl,
  setManualDirectUrl,
  manualMinSalary,
  setManualMinSalary,
  manualMaxSalary,
  setManualMaxSalary,
  manualDatePosted,
  setManualDatePosted,
  manualDescription,
  setManualDescription,
  creating,
  onSubmit,
  darkMode,
  theme,
  muted,
}: ManualCreateModalProps) {
  React.useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create application manually"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 16,
          background: theme.appBg,
          minWidth: 520,
          maxWidth: '90vw',
          boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Add application</h3>
          <button
            onClick={onClose}
            style={{ all: 'unset', cursor: 'pointer', color: muted }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: muted }}>
            {manualUseDetails ? 'Enter minimal job details' : 'Use an existing Job ID'}
          </div>
          <button
            onClick={() => setManualUseDetails(!manualUseDetails)}
            style={{ all: 'unset', color: theme.link, cursor: 'pointer' }}
          >
            {manualUseDetails ? 'Add by app' : 'Add by job'}
          </button>
        </div>
        {!manualUseDetails ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
            <input
              placeholder="Job ID (UUID)"
              value={manualJobId}
              onChange={(e) => setManualJobId(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Application URL (optional)"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.text }} title="Mark as already submitted">
              <input type="checkbox" checked={manualSubmitted} onChange={(e) => setManualSubmitted(e.target.checked)} />
              Submitted
            </label>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              placeholder="Job title"
              value={manualJobTitle}
              onChange={(e) => setManualJobTitle(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Company"
              value={manualJobCompany}
              onChange={(e) => setManualJobCompany(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Location (optional)"
              value={manualJobLocation}
              onChange={(e) => setManualJobLocation(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Job type (e.g., fulltime)"
              value={manualJobType}
              onChange={(e) => setManualJobType(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Min salary (optional)"
              value={manualMinSalary}
              onChange={(e) => setManualMinSalary(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Max salary (optional)"
              value={manualMaxSalary}
              onChange={(e) => setManualMaxSalary(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              type="date"
              placeholder="Date posted (YYYY-MM-DD)"
              value={manualDatePosted}
              onChange={(e) => setManualDatePosted(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="LinkedIn job URL (optional)"
              value={manualLinkedinUrl}
              onChange={(e) => setManualLinkedinUrl(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Direct job URL (optional)"
              value={manualDirectUrl}
              onChange={(e) => setManualDirectUrl(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <input
              placeholder="Application URL (optional)"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              style={{
                gridColumn: '1 / span 1',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <textarea
              placeholder="Job description (optional)"
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              rows={3}
              style={{
                gridColumn: '1 / span 2',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: darkMode ? '#1d1d20' : '#fff',
                color: theme.text,
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.text }} title="Mark as already submitted">
              <input type="checkbox" checked={manualSubmitted} onChange={(e) => setManualSubmitted(e.target.checked)} />
              Submitted
            </label>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              all: 'unset',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              color: muted,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={creating}
            style={{
              all: 'unset',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: darkMode ? '#2563eb' : '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

type JobsSummary = {
  total_jobs: number;
  classifications: { safety: number; target: number; reach: number; dream: number; unreviewed?: number };
  base_urls: Record<string, number>;
};

type AppsSummary = {
  total_apps: number;
  discarded: number;
  approved: number;
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
  assessment: boolean;
  interview: boolean;
  rejected: boolean;
};

type AppStateName = "submitted" | "acknowledged" | "assessment" | "interview" | "rejected";

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
  const [editingStatusFor, setEditingStatusFor] = useState<string | null>(null);
  const [savingAppId, setSavingAppId] = useState<string | null>(null);
  // Manual creation UI state (declared before usage)
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [manualUseDetails, setManualUseDetails] = useState(false);
  const [manualJobId, setManualJobId] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualSubmitted, setManualSubmitted] = useState(false);
  // Minimal job fields if creating a new job
  const [manualJobTitle, setManualJobTitle] = useState("");
  const [manualJobCompany, setManualJobCompany] = useState("");
  const [manualJobLocation, setManualJobLocation] = useState("");
  const [manualJobType, setManualJobType] = useState("");
  const [manualLinkedinUrl, setManualLinkedinUrl] = useState("");
  const [manualDirectUrl, setManualDirectUrl] = useState("");
  const [manualMinSalary, setManualMinSalary] = useState("");
  const [manualMaxSalary, setManualMaxSalary] = useState("");
  const [manualDatePosted, setManualDatePosted] = useState(""); // YYYY-MM-DD
  const [manualDescription, setManualDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const API_BASE = "http://localhost:8000" as const;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const base = "http://localhost:8000";
    const load = async () => {
      try {
        const [jobs_summary, apps_summary, unapproved_jobs, unapproved_apps, applied_apps] = await Promise.all([
          fetch(`${base}/jobs/summary`).then((r) => r.json()),
          fetch(`${base}/apps/summary`).then((r) => r.json()),
          fetch(`${base}/jobs/unapproved`).then((r) => r.json()), // unapproved jobs list
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

  async function updateAppState(appId: string, next: AppStateName) {
    setSavingAppId(appId);
    let prevApp: AppliedApp | undefined;
    setAppliedApps((prev) =>
      prev.map((a) => {
        if (a.app_id === appId) {
          prevApp = a;
          return {
            ...a,
            submitted: next === "submitted",
            acknowledged: next === "acknowledged",
            assessment: next === "assessment",
            interview: next === "interview",
            rejected: next === "rejected",
          };
        }
        return a;
      })
    );
    try {
      const res = await fetch(`${API_BASE}/app/${appId}/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        throw new Error(`Failed to update state: ${res.status}`);
      }
      // Refresh Applications summary and approval queue count
      try {
        const [apps_summary, unapproved_apps] = await Promise.all([
          fetch(`${API_BASE}/apps/summary`).then((r) => r.json()),
          fetch(`${API_BASE}/apps/unapproved`).then((r) => r.json()),
        ]);
        if (apps_summary?.data) setApps(apps_summary.data as AppsSummary);
        setUnapprovedAppsCount(
          Array.isArray(unapproved_apps?.apps) ? unapproved_apps.apps.length : 0
        );
      } catch {
        // Non-fatal: keep optimistic status even if summary refresh fails
      }
    } catch (e) {
      // rollback optimistic change
      if (prevApp) {
        setAppliedApps((prev) =>
          prev.map((a) => (a.app_id === appId ? prevApp as AppliedApp : a))
        );
      }
      setError(e instanceof Error ? e.message : "Failed to update state");
    } finally {
      setSavingAppId(null);
      setEditingStatusFor(null);
    }
  }

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
                {typeof apps.approved === 'number' && (
                  <li>Approved: {apps.approved}</li>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Applied companies and status</h3>
            <button
              onClick={() => setShowManualCreate((v) => !v)}
              style={{
                all: 'unset',
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: theme.appBg,
                color: theme.text,
                cursor: 'pointer',
              }}
              aria-label="Create new application manually"
              title="Create new application manually"
            >
              +
            </button>
          </div>
          <ManualCreateModal
            show={showManualCreate}
            onClose={() => setShowManualCreate(false)}
            manualUseDetails={manualUseDetails}
            setManualUseDetails={setManualUseDetails}
            manualJobId={manualJobId}
            setManualJobId={setManualJobId}
            manualUrl={manualUrl}
            setManualUrl={setManualUrl}
            manualSubmitted={manualSubmitted}
            setManualSubmitted={setManualSubmitted}
            manualJobTitle={manualJobTitle}
            setManualJobTitle={setManualJobTitle}
            manualJobCompany={manualJobCompany}
            setManualJobCompany={setManualJobCompany}
            manualJobLocation={manualJobLocation}
            setManualJobLocation={setManualJobLocation}
            manualJobType={manualJobType}
            setManualJobType={setManualJobType}
            manualLinkedinUrl={manualLinkedinUrl}
            setManualLinkedinUrl={setManualLinkedinUrl}
            manualDirectUrl={manualDirectUrl}
            setManualDirectUrl={setManualDirectUrl}
            manualMinSalary={manualMinSalary}
            setManualMinSalary={setManualMinSalary}
            manualMaxSalary={manualMaxSalary}
            setManualMaxSalary={setManualMaxSalary}
            manualDatePosted={manualDatePosted}
            setManualDatePosted={setManualDatePosted}
            manualDescription={manualDescription}
            setManualDescription={setManualDescription}
            creating={creating}
            onSubmit={submitManualCreate}
            darkMode={darkMode}
            theme={theme}
            muted={muted}
          />
          <div style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            background: theme.appBg,
            overflow: 'hidden',
          }}>
            {(() => {
              // Sort appliedApps alphabetically by company before grouping
              const sortedApps = [...appliedApps].sort((a, b) => {
                const ca = (a.company || 'Unknown').toLowerCase();
                const cb = (b.company || 'Unknown').toLowerCase();
                return ca.localeCompare(cb);
              });
              const grouped: Record<string, AppliedApp[]> = sortedApps.reduce((acc, a) => {
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
                      return (
                        <li key={a.app_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                              <span style={{ fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>{company}</span>
                              <span style={{ color: muted, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{a.title}</span>
                            </div>
                          </div>
          <StatusPill app={a} />
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
                            {items.map((a) => (
                              <li key={a.app_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 12px', borderTop: `1px dashed ${theme.border}`, background: darkMode ? '#1d1d20' : '#fafafa' }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ color: muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                                </div>
                                <StatusPill app={a} />
                              </li>
                            ))}
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

  function StatusPill({ app }: { app: AppliedApp }) {
    // Determine status
    let status: string = "Submitted";
    if (app.rejected) status = "Rejected";
    else if (app.interview) status = "Interview";
    else if (app.assessment) status = "Assessment";
    else if (app.acknowledged) status = "Acknowledged";

    // Color logic for each state
    let color = darkMode ? "#6b7280" : "#9ca3af";
    let bg = darkMode ? "#1f2937" : "#f3f4f6";
    let border = darkMode ? "#374151" : "#e5e7eb";
    if (status === "Rejected") {
      color = darkMode ? "#b91c1c" : "#ef4444";
      bg = darkMode ? "#3f1d1d" : "#fee2e2";
      border = darkMode ? "#7f1d1d" : "#fecaca";
    } else if (status === "Acknowledged") {
      color = darkMode ? "#2563eb" : "#3b82f6";
      bg = darkMode ? "#1e3a8a" : "#dbeafe";
      border = darkMode ? "#1d4ed8" : "#bfdbfe";
    } else if (status === "Assessment") {
      color = darkMode ? "#f59e42" : "#b45309";
      bg = darkMode ? "#78350f" : "#fef3c7";
      border = darkMode ? "#b45309" : "#fde68a";
    } else if (status === "Interview") {
      color = darkMode ? "#10b981" : "#047857";
      bg = darkMode ? "#064e3b" : "#d1fae5";
      border = darkMode ? "#047857" : "#6ee7b7";
    }

    const isEditing = editingStatusFor === app.app_id;
    const isSaving = savingAppId === app.app_id;

    const pillStyle: React.CSSProperties = {
      alignSelf: 'center',
      fontSize: 12,
      padding: '2px 8px',
      borderRadius: 999,
      background: bg,
      color,
      border: `1px solid ${border}`,
      cursor: isSaving ? 'progress' : 'pointer',
      userSelect: 'none',
    };

    if (!isEditing) {
      return (
        <span
          onClick={() => !isSaving && setEditingStatusFor(app.app_id)}
          title="Click to change status"
          style={pillStyle}
        >
          {status}
        </span>
      );
    }

    const optionStyle = (active: boolean, col: string, bgc: string, bdc: string): React.CSSProperties => ({
      fontSize: 12,
      padding: '2px 8px',
      borderRadius: 999,
      background: bgc,
      color: col,
      border: `1px solid ${bdc}`,
      opacity: isSaving && !active ? 0.6 : 1,
      cursor: isSaving ? 'progress' : 'pointer',
    });

    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          disabled={isSaving}
          onClick={() => updateAppState(app.app_id, 'submitted')}
          style={{
            all: 'unset',
            ...optionStyle(status === 'Submitted', (darkMode ? '#6b7280' : '#111827'), (darkMode ? '#1f2937' : '#f3f4f6'), (darkMode ? '#374151' : '#e5e7eb')),
          }}
        >
          Submitted
        </button>
        <button
          disabled={isSaving}
          onClick={() => updateAppState(app.app_id, 'acknowledged')}
          style={{
            all: 'unset',
            ...optionStyle(status === 'Acknowledged', (darkMode ? '#2563eb' : '#1d4ed8'), (darkMode ? '#1e3a8a' : '#dbeafe'), (darkMode ? '#1d4ed8' : '#bfdbfe')),
          }}
        >
          Acknowledged
        </button>
        <button
          disabled={isSaving}
          onClick={() => updateAppState(app.app_id, 'assessment')}
          style={{
            all: 'unset',
            ...optionStyle(status === 'Assessment', (darkMode ? '#f59e42' : '#b45309'), (darkMode ? '#78350f' : '#fef3c7'), (darkMode ? '#b45309' : '#fde68a')),
          }}
        >
          Assessment
        </button>
        <button
          disabled={isSaving}
          onClick={() => updateAppState(app.app_id, 'interview')}
          style={{
            all: 'unset',
            ...optionStyle(status === 'Interview', (darkMode ? '#10b981' : '#047857'), (darkMode ? '#064e3b' : '#d1fae5'), (darkMode ? '#047857' : '#6ee7b7')),
          }}
        >
          Interview
        </button>
        <button
          disabled={isSaving}
          onClick={() => updateAppState(app.app_id, 'rejected')}
          style={{
            all: 'unset',
            ...optionStyle(status === 'Rejected', (darkMode ? '#b91c1c' : '#991b1b'), (darkMode ? '#3f1d1d' : '#fee2e2'), (darkMode ? '#7f1d1d' : '#fecaca')),
          }}
        >
          Rejected
        </button>
        <button
          disabled={isSaving}
          onClick={() => setEditingStatusFor(null)}
          style={{
            all: 'unset',
            color: muted,
            border: `1px solid ${theme.border}`,
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  async function submitManualCreate() {
    if (!manualUseDetails) {
      if (!manualJobId) {
        setError("Job ID is required");
        return;
      }
    } else {
      if (!manualJobTitle || !manualJobCompany) {
        setError("Job title and company are required");
        return;
      }
    }
    setCreating(true);
    try {
      const payload = !manualUseDetails
        ? { job_id: manualJobId, url: manualUrl || null, submitted: manualSubmitted }
        : {
            job: {
              title: manualJobTitle,
              company: manualJobCompany,
              location: manualJobLocation || undefined,
              min_salary: manualMinSalary || undefined,
              max_salary: manualMaxSalary || undefined,
              date_posted: manualDatePosted || undefined,
              job_type: manualJobType || undefined,
              linkedin_job_url: manualLinkedinUrl || undefined,
              direct_job_url: manualDirectUrl || undefined,
              description: manualDescription || undefined,
            },
            url: manualUrl || null,
            submitted: manualSubmitted,
          };

      const res = await fetch(`${API_BASE}/apps/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create app: ${res.status}`);
      // Refresh applied list and summaries
      const [applied_apps, apps_summary, unapproved_apps] = await Promise.all([
        fetch(`${API_BASE}/apps/applied`).then((r) => r.json()),
        fetch(`${API_BASE}/apps/summary`).then((r) => r.json()),
        fetch(`${API_BASE}/apps/unapproved`).then((r) => r.json()),
      ]);
      setAppliedApps(Array.isArray(applied_apps.apps) ? applied_apps.apps : []);
      if (apps_summary?.data) setApps(apps_summary.data as AppsSummary);
      setUnapprovedAppsCount(Array.isArray(unapproved_apps?.apps) ? unapproved_apps.apps.length : 0);
      // reset form
      setManualUseDetails(false);
      setManualJobId("");
      setManualUrl("");
      setManualSubmitted(false);
      setManualJobTitle("");
      setManualJobCompany("");
      setManualJobLocation("");
      setManualJobType("");
      setManualLinkedinUrl("");
      setManualDirectUrl("");
  setManualMinSalary("");
  setManualMaxSalary("");
  setManualDatePosted("");
  setManualDescription("");
      setShowManualCreate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create app');
    } finally {
      setCreating(false);
    }
  }

}

type Theme = { border: string; text: string; appBg: string; link: string };

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
