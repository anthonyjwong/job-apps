"use client";
import { useEffect, useState } from "react";
import { useTheme } from "../providers/ThemeProvider";

type Review = {
  action?: string;
  classification?: "safety" | "target" | "reach" | "dream" | null;
} | null;

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
};

export default function AllJobsPage() {
  const { dark: darkMode } = useTheme();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:8000/jobs", {
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        setJobs(json.jobs || []);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load jobs");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const theme = {
    background: darkMode ? '#18181b' : '#f9f9f9',
    appBg: darkMode ? '#232326' : '#fff',
    border: darkMode ? '#333' : '#ddd',
    text: darkMode ? '#f3f3f3' : '#222',
    link: darkMode ? '#90cdf4' : '#1976d2',
  } as const;

  if (loading) return <main style={{ padding: 16, background: theme.background, color: theme.text, minHeight: '100vh' }}>Loading…</main>;
  if (error) return <main style={{ padding: 16, color: "red", background: theme.background, minHeight: '100vh' }}>Error: {error}</main>;

  const salary = (j: JobRecord) => {
    if (j.min_salary && j.max_salary) return `$${Math.round(j.min_salary)} - $${Math.round(j.max_salary)}`;
    if (j.min_salary) return `$${Math.round(j.min_salary)}`;
    if (j.max_salary) return `$${Math.round(j.max_salary)}`;
    return "—";
  };

  const linkCell = (j: JobRecord) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {j.direct_job_url ? (
        <a href={j.direct_job_url} target="_blank" rel="noreferrer" style={{ color: theme.link, wordBreak: "break-all" }}>
          Direct
        </a>
      ) : (
        <span style={{ color: "#666" }}>Direct —</span>
      )}
      {j.linkedin_job_url ? (
        <a href={j.linkedin_job_url} target="_blank" rel="noreferrer" style={{ color: theme.link, wordBreak: "break-all" }}>
          LinkedIn
        </a>
      ) : (
        <span style={{ color: "#666" }}>LinkedIn —</span>
      )}
    </div>
  );

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto", background: theme.background, color: theme.text, minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 12 }}>All Jobs</h1>
      {jobs.length === 0 ? (
        <p>No jobs yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: theme.appBg }}>
            <thead>
              <tr>
                <th style={th(theme)}>Title</th>
                <th style={th(theme)}>Company</th>
                <th style={th(theme)}>Location</th>
                <th style={th(theme)}>Type</th>
                <th style={th(theme)}>Salary</th>
                <th style={th(theme)}>Posted</th>
                <th style={th(theme)}>Classification</th>
                <th style={th(theme)}>Links</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td style={td(theme)}>{j.title}</td>
                  <td style={td(theme)}>{j.company}</td>
                  <td style={td(theme)}>{j.location || "—"}</td>
                  <td style={tdSmall(theme)}>{j.job_type || "—"}</td>
                  <td style={tdSmall(theme)}>{salary(j)}</td>
                  <td style={tdSmall(theme)}>{j.date_posted || "—"}</td>
                  <td style={tdSmall(theme)}>{j.review?.classification ?? (j.reviewed ? "—" : "unreviewed")}</td>
                  <td style={td(theme)}>{linkCell(j)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

type Theme = { border: string };

const th = (theme: Theme): React.CSSProperties => ({
  textAlign: "left",
  borderBottom: `1px solid ${theme.border}`,
  padding: 8,
});

const td = (theme: Theme): React.CSSProperties => ({
  borderBottom: `1px solid ${theme.border}`,
  padding: 8,
  verticalAlign: "top",
});

const tdSmall = (theme: Theme): React.CSSProperties => ({
  ...td(theme),
  whiteSpace: "nowrap",
});
