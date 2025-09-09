"use client";

// ManualCreateModal moved outside Home for stable identity
import React, { useEffect, useState } from "react";
import AppliedCompaniesList from './components/AppliedCompaniesList';
import AppsSummaryCard from './components/AppsSummaryCard';
import JobsSummaryCard from './components/JobsSummaryCard';
import ManualCreateModal from "./components/ManualCreateModal";
import { useManualCreateForm } from './hooks/useManualCreateForm';
import { useTheme } from "./providers/ThemeProvider";
import { card, cardRow, cardTitle, list } from './styles/dashboard';
import { AppliedApp, AppsSummary, AppStateName, JobsSummary } from './types/dashboard';

// Types now imported from ./types/dashboard

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
  const manual = useManualCreateForm();

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
        <JobsSummaryCard
          jobs={jobs}
          unapprovedJobsCount={unapprovedJobsCount}
          darkMode={darkMode}
          theme={theme}
          muted={muted}
          cardStyle={card(theme)}
          cardTitleStyle={cardTitle}
          listStyle={list}
        />
        <AppsSummaryCard
          apps={apps}
          unapprovedAppsCount={unapprovedAppsCount}
          approvedNoAppCount={approvedNoAppCount}
            approvedNoAppSources={approvedNoAppSources}
          darkMode={darkMode}
          theme={theme}
          muted={muted}
          cardStyle={card(theme)}
          cardTitleStyle={cardTitle}
          listStyle={list}
        />
      </section>

      {/* Top Sources moved into Applications card */}

      {appliedApps && appliedApps.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Applied companies and status</h3>
            <button
              onClick={() => manual.setShowManualCreate(v => !v)}
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
            show={manual.showManualCreate}
            onClose={() => manual.setShowManualCreate(false)}
            manualUseDetails={manual.manualUseDetails}
            setManualUseDetails={manual.setManualUseDetails}
            manualJobId={manual.manualJobId}
            setManualJobId={manual.setManualJobId}
            manualUrl={manual.manualUrl}
            setManualUrl={manual.setManualUrl}
            manualSubmitted={manual.manualSubmitted}
            setManualSubmitted={manual.setManualSubmitted}
            manualJobTitle={manual.manualJobTitle}
            setManualJobTitle={manual.setManualJobTitle}
            manualJobCompany={manual.manualJobCompany}
            setManualJobCompany={manual.setManualJobCompany}
            manualJobLocation={manual.manualJobLocation}
            setManualJobLocation={manual.setManualJobLocation}
            manualJobType={manual.manualJobType}
            setManualJobType={manual.setManualJobType}
            manualLinkedinUrl={manual.manualLinkedinUrl}
            setManualLinkedinUrl={manual.setManualLinkedinUrl}
            manualDirectUrl={manual.manualDirectUrl}
            setManualDirectUrl={manual.setManualDirectUrl}
            manualMinSalary={manual.manualMinSalary}
            setManualMinSalary={manual.setManualMinSalary}
            manualMaxSalary={manual.manualMaxSalary}
            setManualMaxSalary={manual.setManualMaxSalary}
            manualDatePosted={manual.manualDatePosted}
            setManualDatePosted={manual.setManualDatePosted}
            manualDescription={manual.manualDescription}
            setManualDescription={manual.setManualDescription}
            creating={manual.creating}
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
            <AppliedCompaniesList
              apps={appliedApps}
              expanded={expandedCompanies}
              setExpanded={setExpandedCompanies}
              darkMode={darkMode}
              theme={theme}
              muted={muted}
              editingStatusFor={editingStatusFor}
              savingAppId={savingAppId}
              setEditingStatusFor={setEditingStatusFor}
              updateAppState={updateAppState}
            />
          </div>
        </section>
      )}
    </main>
  );

  // StatusPill moved to components/StatusPill.tsx

  async function submitManualCreate() {
    if (!manual.manualUseDetails) {
      if (!manual.manualJobId) {
        setError("Job ID is required");
        return;
      }
    } else {
      if (!manual.manualJobTitle || !manual.manualJobCompany) {
        setError("Job title and company are required");
        return;
      }
    }
    manual.setCreating(true);
    try {
      const payload = !manual.manualUseDetails
        ? { job_id: manual.manualJobId, url: manual.manualUrl || null, submitted: manual.manualSubmitted }
        : {
            job: {
              title: manual.manualJobTitle,
              company: manual.manualJobCompany,
              location: manual.manualJobLocation || undefined,
              min_salary: manual.manualMinSalary || undefined,
              max_salary: manual.manualMaxSalary || undefined,
              date_posted: manual.manualDatePosted || undefined,
              job_type: manual.manualJobType || undefined,
              linkedin_job_url: manual.manualLinkedinUrl || undefined,
              direct_job_url: manual.manualDirectUrl || undefined,
              description: manual.manualDescription || undefined,
            },
            url: manual.manualUrl || null,
            submitted: manual.manualSubmitted,
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
  manual.reset();
  manual.setShowManualCreate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create app');
    } finally {
  manual.setCreating(false);
    }
  }

}

// Theme type imported from ./types/dashboard

// Styles & color helpers moved to dedicated modules
