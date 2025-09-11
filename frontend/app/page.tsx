"use client";

import React, { useEffect, useState } from "react";
import ActionCard from "./components/ActionCard";
import AppliedCompaniesList from './components/AppliedCompaniesList';
import AppsSummaryCard from './components/AppsSummaryCard';
import CompactJobCard from './components/CompactJobCard';
import JobsSummaryCard from './components/JobsSummaryCard';
import ManualCreateModal from "./components/ManualCreateModal";
import { useManualCreateForm } from './hooks/useManualCreateForm';
import { useTheme } from "./providers/ThemeProvider";
import { card, cardRow, cardTitle, list } from './styles/dashboard';
import { AppliedApp, AppsSummary, AppStateName, JobsSummary } from './types/dashboard';

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
    const load = async () => {
      try {
        const [jobs_summary, apps_summary, unapproved_jobs, unapproved_apps, applied_apps] = await Promise.all([
          fetch(`${API_BASE}/jobs/summary`).then((r) => r.json()),
          fetch(`${API_BASE}/apps/summary`).then((r) => r.json()),
          fetch(`${API_BASE}/jobs/unapproved`).then((r) => r.json()), // unapproved jobs list
          fetch(`${API_BASE}/apps/unapproved`).then((r) => r.json()), // prepared but unapproved/undiscarded
          fetch(`${API_BASE}/apps/applied`).then((r) => r.json()), // submitted apps with company/title/status
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
        <ActionCard
          darkMode={darkMode}
          href="/approval"
          color="#F7CF46"
          bigText="Approve"
          smallText="your best matches →"
          count={typeof unapprovedAppsCount === 'number' ? unapprovedAppsCount : undefined}
          ariaLabel="Go to approvals: Jobs fit for you"
          title="Go to approvals"
        />
        <ActionCard
          darkMode={darkMode}
          href="/jobs"
          color="#5AA7C7"
          bigText="Discover"
          smallText="new opportunities →"
          count={typeof unapprovedJobsCount === 'number' ? unapprovedJobsCount : undefined}
          ariaLabel="Go to discovery: Explore jobs"
          title="Explore jobs"
        />
      </section>

      {/* <section style={cardRow}>
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
      </section> */}

      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Interviews</h3>
          {/* get all jobs that are in interview state */}
        </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {appliedApps.filter(a => a.interview).map(a => (
              <div key={a.app_id} style={{ flex: '0 0 auto' }}>
                <CompactJobCard
                  title={a.title}
                  company={a.company}
                  href="/interview-prep"
                  ariaLabel={`Open interview prep for ${a.company} — ${a.title}`}
                  linkTitle={`Interview prep: ${a.company}`}
                  darkMode={darkMode}
                  theme={theme}
                />
              </div>
            ))}
          </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Assessments</h3>
          {/* get all jobs that are in assessment state */}
        </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {appliedApps.filter(a => a.assessment).map(a => (
              <div key={a.app_id} style={{ flex: '0 0 auto' }}>
                <CompactJobCard
                  title={a.title}
                  company={a.company}
                  href="/coding"
                  ariaLabel={`Open coding assessment hub for ${a.company} — ${a.title}`}
                  linkTitle={`Coding assessment: ${a.company}`}
                  darkMode={darkMode}
                  theme={theme}
                />
              </div>
            ))}
          </div>
      </section>

      {appliedApps && appliedApps.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Applied</h3>
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
            form={manual}
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

  async function submitManualCreate() {
    const isValidHttpUrl = (v: string) => {
      try {
        const u = new URL(v.trim());
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    };
    const isUuid = (v: string) => {
      const s = v.trim();
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
    };
    const toNumberOrUndefined = (v: string) => {
      const s = v?.trim();
      if (!s) return undefined;
      const n = Number(s);
      return Number.isNaN(n) ? undefined : n;
    };
    const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v.trim());
    if (!manual.manualUseDetails) {
      if (!manual.manualJobId) {
        setError("Job ID is required");
        return;
      }
      if (!isUuid(manual.manualJobId)) {
        setError("Job ID must be a valid UUID");
        return;
      }
      if (!manual.manualUrl) {
        setError("Application URL is required");
        return;
      }
      if (!isValidHttpUrl(manual.manualUrl)) {
        setError("Application URL must be a valid http(s) URL");
        return;
      }
    } else {
      if (!manual.manualJobTitle || !manual.manualJobCompany || !manual.manualJobLocation) {
        setError("Title, company, and location are required");
        return;
      }
      if (!manual.manualJobUrl) {
        setError("Job URL is required");
        return;
      }
      if (!isValidHttpUrl(manual.manualJobUrl)) {
        setError("Job URL must be a valid http(s) URL");
        return;
      }
      if (manual.manualMinSalary && toNumberOrUndefined(manual.manualMinSalary) === undefined) {
        setError("Min salary must be a number");
        return;
      }
      if (manual.manualMaxSalary && toNumberOrUndefined(manual.manualMaxSalary) === undefined) {
        setError("Max salary must be a number");
        return;
      }
      if (manual.manualDatePosted && !isIsoDate(manual.manualDatePosted)) {
        setError("Date posted must be in YYYY-MM-DD format");
        return;
      }
    }
    manual.setCreating(true);
    try {
      const payload = !manual.manualUseDetails
        ? { job_id: manual.manualJobId.trim(), url: manual.manualUrl.trim(), submitted: manual.manualSubmitted }
        : {
          job: {
            title: manual.manualJobTitle.trim(),
            company: manual.manualJobCompany.trim(),
            location: manual.manualJobLocation.trim(),
            min_salary: toNumberOrUndefined(manual.manualMinSalary),
            max_salary: toNumberOrUndefined(manual.manualMaxSalary),
            date_posted: manual.manualDatePosted ? manual.manualDatePosted.trim() : undefined,
            job_type: manual.manualJobType ? manual.manualJobType.trim() : undefined,
            job_url: manual.manualJobUrl.trim(),
          },
          submitted: manual.manualSubmitted,
        };

      const res = await fetch(`${API_BASE}/apps/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch { }
        throw new Error(`Failed to create app: [${res.status}] ${body}`);
      }
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
