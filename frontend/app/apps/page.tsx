"use client";
import { useEffect, useState } from "react";

type Field = {
  question: string;
  multiple_choice: boolean;
  choices?: string[];
  answer?: string | null;
};

type AppRecord = {
  id: string;
  job_id: string;
  url?: string | null;
  scraped: boolean;
  prepared: boolean;
  user_approved: boolean;
  discarded: boolean;
  submitted: boolean;
  acknowledged: boolean;
  rejected: boolean;
  fields: Field[];
};

export default function AllAppsPage() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch("http://localhost:8000/apps", { headers: { Accept: "application/json" } });
        const json = await res.json();
        setApps(json.apps || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load apps");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return <main style={{ padding: 16 }}>Loading…</main>;
  if (error) return <main style={{ padding: 16, color: "red" }}>Error: {error}</main>;

  return (
    <main style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>All Saved Applications</h1>
      {apps.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Job ID</th>
                <th style={th}>URL</th>
                <th style={th}>States</th>
                <th style={th}>Fields</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td style={td}>{a.id}</td>
                  <td style={td}>{a.job_id}</td>
                  <td style={{ ...td, maxWidth: 240, wordBreak: "break-all" }}>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer" style={{ color: "#1976d2" }}>
                        {a.url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={tdSmall}>
                    <Badge on={a.scraped} label="scraped" /> {" "}
                    <Badge on={a.prepared} label="prepared" /> {" "}
                    <Badge on={a.user_approved} label="approved" /> {" "}
                    <Badge on={a.submitted} label="submitted" /> {" "}
                    <Badge on={a.acknowledged} label="ack" /> {" "}
                    <Badge on={a.rejected} label="rejected" /> {" "}
                    <Badge on={a.discarded} label="discarded" />
                  </td>
                  <td style={td}>
                    {a.fields?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Badge({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        marginRight: 6,
        borderRadius: 12,
        fontSize: 12,
        background: on ? "#e3f2fd" : "#eee",
        color: on ? "#1976d2" : "#666",
        border: `1px solid ${on ? "#90caf9" : "#ddd"}`,
      }}
    >
      {label}
    </span>
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
