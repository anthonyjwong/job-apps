"use client";
import { useEffect, useState } from "react";

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

  if (loading) return <main style={{ padding: 16 }}>Loading…</main>;
  if (error) return <main style={{ padding: 16, color: "red" }}>Error: {error}</main>;

  const salary = (j: JobRecord) => {
    if (j.min_salary && j.max_salary) return `$${Math.round(j.min_salary)} - $${Math.round(j.max_salary)}`;
    if (j.min_salary) return `$${Math.round(j.min_salary)}`;
    if (j.max_salary) return `$${Math.round(j.max_salary)}`;
    return "—";
  };

  const linkCell = (j: JobRecord) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {j.direct_job_url ? (
        <a href={j.direct_job_url} target="_blank" rel="noreferrer" style={{ color: "#1976d2", wordBreak: "break-all" }}>
          Direct
        </a>
      ) : (
        <span style={{ color: "#666" }}>Direct —</span>
      )}
      {j.linkedin_job_url ? (
        <a href={j.linkedin_job_url} target="_blank" rel="noreferrer" style={{ color: "#1976d2", wordBreak: "break-all" }}>
          LinkedIn
        </a>
      ) : (
        <span style={{ color: "#666" }}>LinkedIn —</span>
      )}
    </div>
  );

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>All Jobs</h1>
      {jobs.length === 0 ? (
        <p>No jobs yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Company</th>
                <th style={th}>Location</th>
                <th style={th}>Type</th>
                <th style={th}>Salary</th>
                <th style={th}>Posted</th>
                <th style={th}>Classification</th>
                <th style={th}>Links</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td style={td}>{j.title}</td>
                  <td style={td}>{j.company}</td>
                  <td style={td}>{j.location || "—"}</td>
                  <td style={tdSmall}>{j.job_type || "—"}</td>
                  <td style={tdSmall}>{salary(j)}</td>
                  <td style={tdSmall}>{j.date_posted || "—"}</td>
                  <td style={tdSmall}>{j.review?.classification ?? (j.reviewed ? "—" : "unreviewed")}</td>
                  <td style={td}>{linkCell(j)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: 8,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  verticalAlign: "top",
};

const tdSmall: React.CSSProperties = {
  ...td,
  whiteSpace: "nowrap",
};
